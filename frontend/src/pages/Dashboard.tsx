import React from 'react';
import { useAuth } from '../context/AuthContext.js';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-slate-800 dark:text-slate-100">
      <header className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 rounded-xl mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Task Management System
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={logout}
          className="bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer text-sm"
        >
          Logout
        </button>
      </header>
      <main className="flex items-center justify-center h-[50vh]">
        <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm max-w-md">
          <h2 className="text-xl font-semibold mb-2">Auth Success!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            You have successfully authenticated. The task management board features will be populated in the next step.
          </p>
        </div>
      </main>
    </div>
  );
};
