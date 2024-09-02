import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import './LogViewer.css';

const BASE_ROUTE = 'test-log-viewer-backend.stg.onepunch.agency';
const MAX_LINES = 1000;
const LINE_HEIGHT = 20;

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const listRef = useRef<List>(null);
  const pendingLogsRef = useRef<string>('');

  const appendLogs = useCallback(() => {
    const newLines = pendingLogsRef.current.split('\n');
    if (newLines.length > 1) {
      setLogs(prevLogs => {
        const updatedLogs = [...prevLogs, newLines[0]];
        pendingLogsRef.current = newLines.slice(1).join('\n');
        return updatedLogs.slice(-MAX_LINES);
      });
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchLogs = async () => {
      try {
        const response = await fetch(`https://${BASE_ROUTE}/view-log`, {
          signal: abortController.signal
        });
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get reader from response');
        }
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pendingLogsRef.current += decoder.decode(value, { stream: true });
          appendLogs();
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching logs:', error);
        }
      }
    };

    fetchLogs();

    const logInterval = setInterval(appendLogs, 100);

    const memoryInterval = setInterval(() => {
      if (window.performance && 'memory' in window.performance) {
        setMemoryUsage(window.performance.memory.usedJSHeapSize / (1024 * 1024));
      }
    }, 1000);

    return () => {
      abortController.abort();
      clearInterval(logInterval);
      clearInterval(memoryInterval);
    };
  }, [appendLogs]);

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollToItem(logs.length - 1, 'end');
    }
  }, [logs, autoScroll]);

  const toggleAutoScroll = useCallback(() => {
    setAutoScroll(prev => !prev);
  }, []);

  const Row: React.FC<ListChildComponentProps> = ({ index, style }) => (
    <div className="log-row" style={style}>
      {logs[index]}
    </div>
  );

  return (
    <div className="log-viewer-container">
      <div className="log-viewer-content">
        <div className="log-viewer-header">
          <h2>Log Viewer</h2>
          <button 
            onClick={toggleAutoScroll} 
            className={`auto-scroll-button ${autoScroll ? 'auto-scroll-button-enabled' : 'auto-scroll-button-disabled'}`}
          >
            {autoScroll ? 'Disable' : 'Enable'} Auto-scroll
          </button>
        </div>
        <div className="log-list-container">
          <List
            ref={listRef}
            className="log-list"
            height={window.innerHeight - 180}
            itemCount={logs.length}
            itemSize={LINE_HEIGHT}
            width={'100%'}
          >
            {Row}
          </List>
        </div>
        <div className="memory-usage">
          Memory Usage: {memoryUsage.toFixed(2)} MB
        </div>
      </div>
    </div>
  );
};

export default LogViewer;