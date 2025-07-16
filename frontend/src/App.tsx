import { useEffect, useState } from 'react';
import request from './axios';
import { WS_URL } from './config';
import TransferModal from './TransferModal';

export default function App() {

    const [tableData, setTableData] = useState<any[]>([]);
    const [connected, setConnected] = useState(false);
    const [modalStatus, setModalStatus] = useState(false);
    const [user, setUser] = useState<any>({
        computerName: 'N/A',
        ipAddress: 'N/A',
        country: 'N/A',
        status: 'N/A',
        lastActiveTime: 'N/A',
        additionalSystemDetails: 'N/A',
    });

    const initWebSocket = () => {
        // Create WebSocket connection to your server
        const ws = new WebSocket(WS_URL);

        // Event handler when the WebSocket connection is open
        ws.onopen = () => {
            console.log('Connected to WebSocket');
            setConnected(true);
        };

        // Event handler when a message is received from the server
        ws.onmessage = (event) => {
            if (event.data == 'reload') {
                getUserList();
            }
        };

        // Event handler when WebSocket encounters an error
        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        // Event handler when the WebSocket connection is closed
        ws.onclose = () => {
            console.log('Disconnected from WebSocket');
            setConnected(false);
        };
    }

    const getUserList = async () => {
        const info = await request({
            url: "info/get-user-list",
            method: "POST",
        });
        setTableData(info.data.userList);
    }

    const handleActionClicked = (userItem: any) => {
        setUser(userItem);
        setModalStatus(true);
    }

    const handleProcess = async (user: any, textOption: string, textContent: string) => {
        await request({
            url: "command/send-script-to-client",
            method: "POST",
            data: {
                user,
                type: textOption,
                script: textContent
            }
        });
        setModalStatus(false)
    }

    useEffect(() => {
        initWebSocket();
        getUserList();
    }, [])

    return (
        <>
            <TransferModal
                isOpen={modalStatus}
                setIsOpen={setModalStatus}
                handleProcess={handleProcess}
                user={user}
            />
            <div className="dark:bg-boxdark-2 dark:text-bodydark">
                <div className="flex h-screen overflow-hidden">
                    <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                        <main>
                            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                                <div className="flex flex-col gap-10">
                                    <h1 className='mt-5 text-center text-gray-800 text-2xl'>Windows System Management Web Panel</h1>
                                    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                                        <div className="max-w-full overflow-x-auto">
                                            <table className="w-full table-auto">
                                                <thead>
                                                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                                        <th className="min-w-[220px] py-2 px-2 font-medium text-black dark:text-white xl:pl-11">
                                                            Computer Name
                                                        </th>
                                                        <th className="min-w-[150px] py-2 px-2 font-medium text-black dark:text-white">
                                                            IP Address
                                                        </th>
                                                        <th className="min-w-[120px] py-2 px-2 font-medium text-black dark:text-white">
                                                            Country
                                                        </th>
                                                        <th className="min-w-[120px] py-2 px-2 font-medium text-black dark:text-white">
                                                            Status
                                                        </th>
                                                        <th className="min-w-[120px] py-2 px-2 font-medium text-black dark:text-white">
                                                            Last Active Time
                                                        </th>
                                                        <th className="min-w-[120px] py-2 px-2 font-medium text-black dark:text-white">
                                                            Additional System Details
                                                        </th>
                                                        <th className="py-2 px-2 font-medium text-black dark:text-white">
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        tableData.map((tableItem, key) => (
                                                            <tr key={key}>
                                                                <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                                                                    <p className="text-black dark:text-white text-sm">{tableItem.computerName}</p>
                                                                </td>
                                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                                    <p className="text-black dark:text-white text-sm">
                                                                        {tableItem.ipAddress}
                                                                    </p>
                                                                </td>
                                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                                    <p className="text-black dark:text-white text-sm">
                                                                        {tableItem.country}
                                                                    </p>
                                                                </td>
                                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                                    <p
                                                                        className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${tableItem.status === 'Paid'
                                                                            ? 'bg-success text-success'
                                                                            : tableItem.status === 'Inactive'
                                                                                ? 'bg-danger text-danger'
                                                                                : 'bg-success text-success'
                                                                            }`}
                                                                    >
                                                                        {tableItem.status}
                                                                    </p>
                                                                </td>
                                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                                    <p className="text-black dark:text-white text-sm">
                                                                        {tableItem.lastActiveTime}
                                                                    </p>
                                                                </td>
                                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                                    <p className="text-black dark:text-white text-sm">
                                                                        {tableItem.additionalSystemDetails}
                                                                    </p>
                                                                </td>
                                                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                                                    <div className="flex items-center space-x-3.5">
                                                                        <button className="hover:text-primary" onClick={() => handleActionClicked(tableItem)}>
                                                                            <svg
                                                                                className="fill-current"
                                                                                width="18"
                                                                                height="18"
                                                                                viewBox="0 0 18 18"
                                                                                fill="none"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                            >
                                                                                <path
                                                                                    d="M16.8754 11.6719C16.5379 11.6719 16.2285 11.9531 16.2285 12.3187V14.8219C16.2285 15.075 16.0316 15.2719 15.7785 15.2719H2.22227C1.96914 15.2719 1.77227 15.075 1.77227 14.8219V12.3187C1.77227 11.9812 1.49102 11.6719 1.12539 11.6719C0.759766 11.6719 0.478516 11.9531 0.478516 12.3187V14.8219C0.478516 15.7781 1.23789 16.5375 2.19414 16.5375H15.7785C16.7348 16.5375 17.4941 15.7781 17.4941 14.8219V12.3187C17.5223 11.9531 17.2129 11.6719 16.8754 11.6719Z"
                                                                                    fill=""
                                                                                />
                                                                                <path
                                                                                    d="M8.55074 12.3469C8.66324 12.4594 8.83199 12.5156 9.00074 12.5156C9.16949 12.5156 9.31012 12.4594 9.45074 12.3469L13.4726 8.43752C13.7257 8.1844 13.7257 7.79065 13.5007 7.53752C13.2476 7.2844 12.8539 7.2844 12.6007 7.5094L9.64762 10.4063V2.1094C9.64762 1.7719 9.36637 1.46252 9.00074 1.46252C8.66324 1.46252 8.35387 1.74377 8.35387 2.1094V10.4063L5.40074 7.53752C5.14762 7.2844 4.75387 7.31252 4.50074 7.53752C4.24762 7.79065 4.27574 8.1844 4.50074 8.43752L8.55074 12.3469Z"
                                                                                    fill=""
                                                                                />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}