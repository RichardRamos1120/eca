import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';

interface Message {
    text: string;
    type: 'user' | 'ai';
}

// Define the equipment and their respective questions
const equipmentQuestions = {
    "Helmet": [
        "How do I inspect my helmet for damage?",
        "What is the proper way to clean my helmet?",
        "How often should I replace my helmet?"
    ],
    "Turnout Gear": [
        "What are the best practices for maintaining my turnout gear?",
        "How do I properly clean and store turnout gear?",
        "When should I inspect my turnout gear for wear and tear?"
    ],
    "Boots": [
        "How do I clean and maintain my fire-resistant boots?",
        "What should I do if my boots get damaged?",
        "How can I ensure my boots fit properly?"
    ],
    "Gloves": [
        "How do I inspect my gloves for damage?",
        "What is the best way to clean my fire-resistant gloves?",
        "When should I replace my gloves?"
    ],
    "Hood": [
        "How do I care for my flash hood?",
        "What materials are best for flash hoods?",
        "How can I check if my flash hood is still effective?"
    ],
    "SCBA": [
        "How often should I inspect my SCBA?",
        "What are the maintenance steps for my SCBA?",
        "How do I properly clean my SCBA?"
    ],
    "Firefighter Mask": [
        "How do I clean and maintain my firefighter mask?",
        "What should I do if my mask gets damaged?",
        "How do I properly store my firefighter mask?"
    ]
};

const Chat: React.FC = () => {
    const [selectedEquipment, setSelectedEquipment] = useState<string>(''); // State for selected equipment
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFirstVisit, setIsFirstVisit] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const initialAIMessage: Message = {
        text: "👨‍🚒 Hey there! I'm equipHelper, your expert assistant for all things firefighting equipment! 🧰 Need help with maintaining your gear, or have questions about equipment care and inspection? Let’s make sure you're well-prepared for every emergency with properly maintained gear! 🚒💡",
        type: 'ai',
    };

    useEffect(() => {
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
            setIsFirstVisit(false);
        } else {
            setMessages([initialAIMessage]);
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chatMessages', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSubmitLogic = async (questionToSubmit: string) => {
        if (!questionToSubmit.trim()) return;

        setLoading(true);

        const userMessage: Message = { text: questionToSubmit, type: 'user' };
        setMessages((prev) => {
            if (isFirstVisit) {
                setIsFirstVisit(false);
                return [...prev.slice(1), userMessage];
            }
            return [...prev, userMessage];
        });
        setQuestion('');

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: questionToSubmit }),
            });

            const data = await res.json();
            const aiMessage: Message = { text: data.answer, type: 'ai' };
            setMessages((prev) => [...prev, aiMessage]);
        } catch {
            const errorMessage: Message = { text: 'Sorry, something went wrong.', type: 'ai' };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmitLogic(question);
    };

    const handlePredefinedQuestion = (predefinedQuestion: string) => {
        setQuestion(predefinedQuestion);
        handleSubmitLogic(predefinedQuestion);
    };

    const handleEquipmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedEquipment(e.target.value);
        setQuestion(''); // Clear the current question
    };

    const clearHistory = () => {
        const initialMessages = [initialAIMessage];
        setMessages(initialMessages);
        localStorage.removeItem('chatMessages');
        setIsFirstVisit(true);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        const title = "equipHelper Chat History";
        doc.setFontSize(20);
        doc.text(title, 10, 10);

        let y = 20;
        messages.forEach((message) => {
            const sender = message.type === 'user' ? 'User' : 'equipHelper';
            doc.setFontSize(12);
            const text = `${sender}: ${message.text}`;
            const splitText = doc.splitTextToSize(text, 180);

            // Set text color based on sender
            if (message.type === 'user') {
                doc.setTextColor(0, 102, 204); // User: Blue
            } else {
                doc.setTextColor(255, 165, 0); // equipHelper: Orange
            }

            splitText.forEach((line: string | string[]) => {
                doc.text(line, 10, y);
                y += 10;
            });

            if (y > 280) {
                doc.addPage();
                y = 10;
            }
        });

        doc.save('equipHelper_Chat_History.pdf');
    };

    // Function to format long AI replies into separate paragraphs
    const formatText = (text: string) => {
        if (typeof text !== 'string') {
            return <p>Error: Invalid text format.</p>;
        }

        const sentences = text.split(/(?<!\b\w)\.(?=\s|$)/).filter((sentence) => sentence.trim() !== '');

        return sentences.map((sentence, index) => (
            <p key={index} className="mb-2">{sentence.trim()}.</p>
        ));
    };

    const getQuestionsForSelectedEquipment = () => {
        if (selectedEquipment) {
            return equipmentQuestions[selectedEquipment as keyof typeof equipmentQuestions] || [];
        }
        return [];
    };

    return (
        <div className="flex flex-col h-screen bg-orange-50 p-4 max-w-screen-xl mx-auto relative">
            <header className="text-center text-3xl font-bold text-orange-700 mb-6">
                equipHelper
            </header>

            <div className="flex justify-end mb-4">
                <button
                    onClick={clearHistory}
                    className="bg-red-600 text-white text-sm rounded-full px-3 py-1 hover:bg-red-700 transition mr-2"
                >
                    Clear History
                </button>

                <button
                    onClick={downloadPDF}
                    className="bg-orange-600 text-white text-sm rounded-full px-3 py-1 hover:bg-orange-700 transition"
                >
                    Download PDF
                </button>
            </div>

            <div className="flex-grow overflow-y-auto bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 border-orange-500">
                {messages.map((message, index) => (
                    <div key={index} className={`mb-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`text-sm font-semibold ${message.type === 'user' ? 'text-blue-600' : 'text-gray-700'}`}>
                            {message.type === 'user' ? 'User' : 'equipHelper'}
                        </div>
                        <div className={`inline-block p-3 rounded-lg shadow-md ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-orange-100 text-black'}`}>
                            {message.type === 'ai' ? formatText(message.text) : <p>{message.text}</p>}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start mb-2">
                        <Image
                            src="/loadingGIF.gif"
                            alt="Loading..."
                            width={64}
                            height={64}
                            className="mr-2"
                        />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {isFirstVisit && (
                <div className="bg-orange-100 p-2 mb-4 text-sm text-orange-800 border border-orange-300 rounded-md">
                    Welcome! Ask me about firefighting equipment or maintenance. 
                </div>
            )}

            {/* Dropdown for selecting equipment */}
            <div className="mb-4">
                <label htmlFor="equipment" className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Equipment:
                </label>
                <select
                    id="equipment"
                    value={selectedEquipment}
                    onChange={handleEquipmentChange}
                    className="border border-gray-300 rounded-md p-2 w-full"
                >
                    <option value="">Select Equipment</option>
                    {Object.keys(equipmentQuestions).map((equipment) => (
                        <option key={equipment} value={equipment}>
                            {equipment}
                        </option>
                    ))}
                </select>
            </div>

            {/* Display predefined questions based on selected equipment */}
            {selectedEquipment && (
                <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Predefined Questions:</h3>
                    <div className="flex flex-col space-y-2">
                        {getQuestionsForSelectedEquipment().map((predefinedQuestion, index) => (
                            <button
                                key={index}
                                onClick={() => handlePredefinedQuestion(predefinedQuestion)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md text-left"
                            >
                                {predefinedQuestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input area for new questions */}
            <form onSubmit={handleSubmit} className="flex">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your question..."
                    className="border border-gray-300 rounded-l-md p-2 flex-grow"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white font-semibold rounded-r-md px-4 hover:bg-blue-700 transition"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;
