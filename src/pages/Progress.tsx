import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export const Progress: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('log_date', { ascending: false })
      .limit(30);
    
    if (data) setLogs(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-dark">Your Progress</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Last 30 Days Effort %</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48 mt-4 overflow-x-auto pb-2">
            {logs.slice().reverse().map((log, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 min-w-[30px]">
                <div 
                  className="w-full bg-primary rounded-t-sm transition-all duration-500" 
                  style={{ height: `${Math.max(log.effort_percent, 5)}%` }} 
                  title={`${log.effort_percent}% on ${log.log_date}`}
                ></div>
                <span className="text-[10px] text-gray-500 truncate w-full text-center">
                  {log.log_date.split('-').slice(1).join('/')}
                </span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-gray-500 w-full text-center self-center">No activity data yet. Start practicing!</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex justify-between items-center p-4 border border-secondary rounded-lg">
                  <div>
                    <p className="font-semibold text-dark">{log.log_date}</p>
                    <p className="text-sm text-gray-600">Module: {log.module}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {Math.round(log.effort_percent)}% Effort
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
