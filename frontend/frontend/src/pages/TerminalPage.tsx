import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { XTerm } from 'xterm-for-react';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const TerminalPage: React.FC = () => {
    const { uuid } = useParams<{ uuid: string }>();
    const xtermRef = useRef<XTerm>(null);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Ensure we are running in a browser environment
        if (typeof window === 'undefined' || !xtermRef.current) {
            return;
        }

        const term = xtermRef.current.terminal;
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        fitAddon.fit();

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/terminal/${uuid}`;

        ws.current = new WebSocket(wsUrl);

        const onResize = () => {
            fitAddon.fit();
            const { cols, rows } = term;
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                const resizeMsg = JSON.stringify({ type: 'resize', cols, rows });
                ws.current.send(resizeMsg);
            }
        };

        ws.current.onopen = () => {
            console.log('Terminal WebSocket connection opened.');
            window.addEventListener('resize', onResize);
            onResize(); // Initial resize
        };

        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'data') {
                    term.write(message.data);
                } else if (message.type === 'exit') {
                    term.writeln(`\r\n\r\n[Connection Closed]: ${message.message}`);
                }
            } catch (e) {
                // In case of non-JSON messages, which might happen with raw pty data
                term.write(event.data);
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket Error:', error);
            term.writeln('\r\n\r\n[WebSocket Connection Error]');
        };

        ws.current.onclose = () => {
            console.log('Terminal WebSocket connection closed.');
            term.writeln('\r\n\r\n[WebSocket Connection Closed]');
            window.removeEventListener('resize', onResize);
        };

        // Cleanup on component unmount
        return () => {
            window.removeEventListener('resize', onResize);
            ws.current?.close();
        };
    }, [uuid]);

    const onData = (data: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'data', data }));
        }
    };

    return (
        <div className="p-4 md:p-6 2xl:p-10" style={{ height: 'calc(100vh - 100px)' }}>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                    Terminal: {uuid}
                </h2>
            </div>
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1" style={{ height: '80vh', width: '100%' }}>
                <XTerm
                    ref={xtermRef}
                    onData={onData}
                    options={{
                        cursorBlink: true,
                        fontFamily: 'monospace',
                        theme: {
                            background: '#1e1e1e',
                            foreground: '#d4d4d4',
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default TerminalPage;
