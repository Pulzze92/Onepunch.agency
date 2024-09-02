import { useState, useEffect, useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

const BASE_ROUTE = 'test-log-viewer-backend.stg.onepunch.agency';
const MAX_LINES = 1000;
const LINE_HEIGHT = 20;

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const listRef = useRef(null);
  const pendingLogsRef = useRef('');

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
    let abortController = new AbortController();

    const fetchLogs = async () => {
      try {
        const response = await fetch(`https://${BASE_ROUTE}/view-log`, {
          signal: abortController.signal
        });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pendingLogsRef.current += decoder.decode(value, { stream: true });
          appendLogs();
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching logs:', error);
        }
      }
    };

    fetchLogs();

    const logInterval = setInterval(appendLogs, 100);

    const memoryInterval = setInterval(() => {
      if (window.performance && window.performance.memory) {
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

  const Row = ({ index, style }) => (
    <div style={{
      ...style,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '0 10px',
      borderBottom: '1px solid #eee',
      fontFamily: 'monospace',
    }}>
      {logs[index]}
    </div>
  );

  return (
    <div style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
        <h2>Log Viewer</h2>
        <button 
          onClick={toggleAutoScroll} 
          style={{ 
            padding: '5px 10px',
            cursor: 'pointer',
            backgroundColor: autoScroll ? '#4CAF50' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {autoScroll ? 'Disable' : 'Enable'} Auto-scroll
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <List
          ref={listRef}
          height={window.innerHeight - 200}
          itemCount={logs.length}
          itemSize={LINE_HEIGHT}
          width={'100%'}
          style={{ border: '1px solid #ccc' }}
        >
          {Row}
        </List>
      </div>
      <div style={{ padding: '10px' }}>
        Memory Usage: {memoryUsage.toFixed(2)} MB
      </div>
    </div>
  );
};

export default LogViewer;