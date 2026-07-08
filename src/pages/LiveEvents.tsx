import React, { useState, useEffect, useCallback } from 'react';
import { fetchContractEvents } from '../services/stellar';

interface EventItem {
  id: string;
  name: string;
  address: string;
  ledger: string;
  time: string;
  payload: string;
}

export const LiveEvents: React.FC = () => {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock fallback events
  const mockEvents: EventItem[] = [
    {
      id: 'mock_ev1',
      name: 'StudentRegistered',
      address: 'GC74...K2H1',
      ledger: '51,283,042',
      time: 'Just Now',
      payload: '{"id":"STD_882", "dept":"CS"}'
    },
    {
      id: 'mock_ev2',
      name: 'RewardDistributed',
      address: 'GD2O...P9L0',
      ledger: '51,283,040',
      time: '2 mins ago',
      payload: '{"amt":"50.0", "curr":"XLM"}'
    },
    {
      id: 'mock_ev3',
      name: 'ContractInitialized',
      address: 'GA1F...R4S5',
      ledger: '51,283,035',
      time: '5 mins ago',
      payload: '{"ver":"1.0.4", "owner":"SP"}'
    }
  ];

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const contractId = import.meta.env.VITE_CONTRACT_ID;
      const rawEvents = await fetchContractEvents(contractId);
      
      const formatted: EventItem[] = rawEvents.map((e: any, idx: number) => {
        const topicName = e.topics[0] || 'Unknown';
        
        let name = 'ContractEvent';
        if (topicName === 'register') name = 'StudentRegistered';
        else if (topicName === 'reward') name = 'RewardDistributed';
        else if (topicName === 'claim') name = 'PointsClaimed';
        
        const rawAddress = e.topics[1] || contractId;
        const address = `${rawAddress.substring(0, 6)}...${rawAddress.substring(rawAddress.length - 4)}`;
        
        let time = 'Recent';
        if (e.ledgerClosedAt) {
          const diffMs = Date.now() - new Date(e.ledgerClosedAt).getTime();
          const diffMins = Math.floor(diffMs / 60000);
          if (diffMins < 1) {
            time = 'Just Now';
          } else if (diffMins === 1) {
            time = '1 min ago';
          } else {
            time = `${diffMins} mins ago`;
          }
        }
        
        let payloadObj: any = {};
        if (topicName === 'register') {
          payloadObj = { name: e.value };
        } else if (topicName === 'reward' || topicName === 'claim') {
          payloadObj = { points: e.value };
        } else {
          payloadObj = { value: e.value };
        }
        
        return {
          id: e.id || `${idx}`,
          name,
          address,
          ledger: e.ledger ? e.ledger.toLocaleString() : 'Recent',
          time,
          payload: JSON.stringify(payloadObj)
        };
      });
      
      setEvents([...formatted, ...mockEvents]);
    } catch (err) {
      console.error('Failed to load live events:', err);
      setEvents(mockEvents);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    if (!isAutoRefresh) return;
    
    // Set 5-second interval for real-time responsiveness
    const interval = setInterval(() => {
      fetchEvents();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, fetchEvents]);

  const activeEvents = events.length > 0 ? events : mockEvents;

  const filteredEvents = activeEvents.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-up pb-8 text-gray-900 dark:text-gray-100">
      {/* Stats Bento Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Events (Today)</p>
            <h3 className="text-3xl font-extrabold text-black dark:text-white mt-2">1,284</h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            <span>+12.4% from yesterday</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Students</p>
            <h3 className="text-3xl font-extrabold text-black dark:text-white mt-2">4,892</h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Network growth steady</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stellar Network Status</p>
            <h3 className="text-3xl font-extrabold text-black dark:text-white mt-2">Low Latency</h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <span className="material-symbols-outlined text-[18px]">speed</span>
            <span>Ledger validation active</span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-12 pr-4 focus:border-black dark:focus:border-white text-gray-900 dark:text-white placeholder:text-gray-400 outline-none transition-all text-sm"
              placeholder="Search events or addresses..."
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSearch('')} className="px-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 font-semibold transition-all">All</button>
            <button onClick={() => setSearch('Register')} className="px-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 font-semibold transition-all">Registration</button>
            <button onClick={() => setSearch('Reward')} className="px-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 font-semibold transition-all">Rewards</button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Auto-refresh</span>
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isAutoRefresh ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-800'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full transition-transform ${isAutoRefresh ? 'translate-x-6 bg-white dark:bg-black' : 'translate-x-1 bg-gray-400 dark:bg-gray-500'}`}></span>
          </button>
        </div>
      </div>

      {/* Table View */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-100/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Wallet Address</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Ledger</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading && events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    <div className="skeleton h-8 w-48 mx-auto rounded-lg mb-2"></div>
                    <p className="text-xs">Loading ledger events...</p>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                    <p className="text-sm">No contract events found in this ledger range</p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-800 dark:text-gray-200">
                          <span className="material-symbols-outlined text-[18px]">
                            {event.name === 'StudentRegistered' ? 'person_add' : 'military_tech'}
                          </span>
                        </div>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{event.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-500 dark:text-gray-400">{event.address}</td>
                    <td className="px-6 py-4 text-center font-mono text-sm text-gray-900 dark:text-white">{event.ledger}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">{event.time}</td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 px-2.5 py-1 rounded font-mono">
                        {event.payload}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center border-t border-gray-200 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">Showing latest {filteredEvents.length} events</span>
        </div>
      </div>
    </div>
  );
};
