// src/components/questions/EnhancedQuestionCard.jsx
// Displays questions with mathematical equations, diagrams, and images

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Lightbulb, Eye, EyeOff, Image as ImageIcon,
    ChevronDown, ChevronUp, BookCheck, Maximize2, X
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const EnhancedQuestionCard = ({
                                  question,
                                  questionNumber,
                                  showSolutionButton = true,
                                  onShowSolution
                              }) => {
    const [showHints, setShowHints] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showSolution, setShowSolution] = useState(false);

    // Parse equations from JSON
    const equations = question.equations ?
        (typeof question.equations === 'string' ? JSON.parse(question.equations) : question.equations)
        : [];

    // Parse images from JSON
    const questionImages = question.question_images ?
        (typeof question.question_images === 'string' ? JSON.parse(question.question_images) : question.question_images)
        : [];

    // Parse hints
    const hints = question.hints ?
        (typeof question.hints === 'string' ? JSON.parse(question.hints) : question.hints)
        : [];

    // Render math equation safely
    const renderMath = (latex, inline = true) => {
        try {
            if (inline) {
                return <InlineMath math={latex} />;
            } else {
                return <BlockMath math={latex} />;
            }
        } catch (error) {
            console.error('Math render error:', error);
            return <code className="bg-red-50 text-red-600 px-2 py-1 rounded">{latex}</code>;
        }
    };

    const handleSolutionToggle = () => {
        if (!showSolution && onShowSolution) {
            onShowSolution(question.id);
        }
        setShowSolution(!showSolution);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-purple-400 hover:shadow-xl transition-all"
            >
                {/* Question Header */}
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                        {/* Question Number */}
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl flex-shrink-0 shadow-lg">
                            {questionNumber}
                        </div>

                        <div className="flex-1">
                            {/* Question Title */}
                            <h3 className="text-xl font-bold text-gray-800 mb-3">
                                {question.question_text?.split('\n')[0] || `שאלה ${questionNumber}`}
                            </h3>

                            {/* Question Text */}
                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                                {question.question_text}
                            </div>

                            {/* Equations Section */}
                            {equations.length > 0 && (
                                <div className="bg-blue-50 rounded-xl p-4 mb-4 border-2 border-blue-200">
                                    <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                        📐 משוואות:
                                    </h4>
                                    <div className="space-y-3">
                                        {equations.map((eq, index) => (
                                            <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                                                {eq.description && (
                                                    <p className="text-sm text-blue-600 mb-2 font-medium">
                                                        {eq.description}
                                                    </p>
                                                )}
                                                <div className="text-center py-2">
                                                    {renderMath(eq.latex, false)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Diagram Description */}
                            {question.has_diagrams && question.diagram_description && (
                                <div className="bg-purple-50 rounded-xl p-4 mb-4 border-2 border-purple-200">
                                    <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5" />
                                        תיאור הגרף/תרשים:
                                    </h4>
                                    <p className="text-purple-900">
                                        {question.diagram_description}
                                    </p>
                                </div>
                            )}

                            {/* Images Gallery */}
                            {questionImages.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5" />
                                        תמונות וגרפים ({questionImages.length}):
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {questionImages.map((img, index) => (
                                            <motion.div
                                                key={index}
                                                whileHover={{ scale: 1.05 }}
                                                onClick={() => setSelectedImage(img)}
                                                className="relative bg-gray-100 rounded-xl overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-purple-400 transition-all"
                                            >
                                                <img
                                                    src={img.url}
                                                    alt={img.description || `תרשים ${index + 1}`}
                                                    className="w-full h-48 object-contain"
                                                />
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                                    <p className="text-white text-sm font-bold">
                                                        {img.description || `תרשים ${index + 1}`}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-white text-xs mt-1">
                                                        <Maximize2 className="w-3 h-3" />
                                                        לחץ להגדלה
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {question.topic && (
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                                        📚 {question.topic}
                                    </span>
                                )}
                                {question.subtopic && (
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                                        📖 {question.subtopic}
                                    </span>
                                )}
                                {question.difficulty && (
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                        question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                    }`}>
                                        {question.difficulty === 'easy' ? '⭐ קל' :
                                            question.difficulty === 'medium' ? '⭐⭐ בינוני' :
                                                '⭐⭐⭐ קשה'}
                                    </span>
                                )}
                                {question.has_diagrams && (
                                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                        <ImageIcon className="w-4 h-4" />
                                        כולל גרף
                                    </span>
                                )}
                                {question.has_solution && (
                                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                        <BookCheck className="w-4 h-4" />
                                        פתרון זמין
                                    </span>
                                )}
                            </div>

                            {/* Hints Section */}
                            {hints.length > 0 && (
                                <div>
                                    <button
                                        onClick={() => setShowHints(!showHints)}
                                        className="w-full flex items-center justify-between bg-yellow-50 hover:bg-yellow-100 rounded-xl p-4 transition-colors border-2 border-yellow-200"
                                    >
                                        <div className="flex items-center gap-2 font-bold text-yellow-800">
                                            <Lightbulb className="w-5 h-5" />
                                            רמזים ({hints.length})
                                        </div>
                                        {showHints ?
                                            <ChevronUp className="w-5 h-5 text-yellow-600" /> :
                                            <ChevronDown className="w-5 h-5 text-yellow-600" />
                                        }
                                    </button>

                                    <AnimatePresence>
                                        {showHints && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-yellow-50 rounded-b-xl px-4 pb-4 pt-2 border-x-2 border-b-2 border-yellow-200">
                                                    <ul className="space-y-2">
                                                        {hints.map((hint, i) => (
                                                            <motion.li
                                                                key={i}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: i * 0.1 }}
                                                                className="flex gap-2 text-yellow-900"
                                                            >
                                                                <span className="font-bold">💡</span>
                                                                <span>{hint}</span>
                                                            </motion.li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Solution Button */}
                            {showSolutionButton && question.has_solution && (
                                <button
                                    onClick={handleSolutionToggle}
                                    className="w-full mt-4 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {showSolution ? (
                                        <>
                                            <EyeOff className="w-5 h-5" />
                                            הסתר פתרון
                                            <ChevronUp className="w-5 h-5" />
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-5 h-5" />
                                            הצג פתרון מלא
                                            <ChevronDown className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Image Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden"
                        >
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg z-10"
                            >
                                <X className="w-6 h-6 text-gray-800" />
                            </button>
                            <img
                                src={selectedImage.url}
                                alt={selectedImage.description}
                                className="w-full h-auto"
                            />
                            {selectedImage.description && (
                                <div className="bg-gray-100 p-4">
                                    <p className="text-gray-800 font-bold text-center">
                                        {selectedImage.description}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default EnhancedQuestionCard;