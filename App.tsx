import React, { useState } from 'react';
import './App.css';

interface Task {
  id: number;
  title: string;
  deadline: string;
  isPublic: boolean;
  isCompleted: boolean;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now(),
        title: newTaskTitle,
        deadline: newTaskDeadline,
        isPublic: true,
        isCompleted: false,
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setNewTaskDeadline('');
    }
  };

  const toggleTaskCompletion = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🚀 Social Productivity App</h1>
        <p>Create tasks and stay accountable!</p>
      </header>

      <main className="app-main">
        {/* Task Creation Form */}
        <div className="task-form">
          <h2>Create New Task</h2>
          <div className="form-group">
            <input
              type="text"
              placeholder="What do you need to do?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="date"
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              className="form-input"
            />
          </div>
          <button onClick={addTask} className="btn btn-primary">
            Add Task
          </button>
        </div>

        {/* Task List */}
        <div className="task-list">
          <h2>Your Tasks ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p className="no-tasks">No tasks yet. Create your first one above!</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`task-item ${task.isCompleted ? 'completed' : ''}`}>
                <div className="task-content">
                  <h3>{task.title}</h3>
                  <p>Deadline: {task.deadline}</p>
                  <span className={`status ${task.isCompleted ? 'completed' : 'pending'}`}>
                    {task.isCompleted ? '✅ Completed' : '⏳ Pending'}
                  </span>
                </div>
                <div className="task-actions">
                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className={`btn ${task.isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {task.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;