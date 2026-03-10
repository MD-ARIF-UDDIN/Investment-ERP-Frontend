import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ children, isOpen, onClose, title, maxWidth = 'max-w-md' }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity duration-300 ease-out"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} transform transition-all duration-300 ease-out overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-300`}>
                {/* Header */}
                {title && (
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-xl font-bold text-gray-900 font-bengali">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                <div className="max-h-[85vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
