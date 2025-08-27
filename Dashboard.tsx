import React from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import TaskSummary from '../components/tasks/TaskSummary';
import RecentTasks from '../components/tasks/RecentTasks';
import StreakDisplay from '../components/common/StreakDisplay';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { state } = useTaskContext();
  const { tasks } = state;

  const completedTasks = tasks.filter(task => task.isCompleted);
  const overdueTasks = tasks.filter(
    task => !task.isCompleted && new Date(task.deadline) < new Date()
  );
  const upcomingTasks = tasks.filter(
    task => !task.isCompleted && new Date(task.deadline) >= new Date()
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Your Productivity Dashboard</h1>
        <p>Track your progress and stay accountable</p>
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <TaskSummary
            totalTasks={tasks.length}
            completedTasks={completedTasks.length}
            overdueTasks={overdueTasks.length}
            upcomingTasks={upcomingTasks.length}
          />
          
          <StreakDisplay
            currentStreak={5} // This will come from user context later
            longestStreak={12}
            completionRate={75}
          />
        </div>

        <div className="dashboard-sidebar">
          <RecentTasks tasks={tasks.slice(0, 5)} />
          
          {overdueTasks.length > 0 && (
            <div className="overdue-alert">
              <h3>⚠️ Overdue Tasks</h3>
              <p>You have {overdueTasks.length} overdue tasks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;