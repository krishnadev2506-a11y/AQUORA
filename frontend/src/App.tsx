import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Dataset from './pages/Dataset';
import Models from './pages/Models';
import Predictions from './pages/Predictions';
import Reports from './pages/Reports';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 font-sans">
        <Navbar />
        <main className="flex-grow pt-16 relative">
          <ErrorBoundary fallbackTitle="APPLICATION VIEW RECOVERY">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dataset" element={<Dataset />} />
              <Route path="/models" element={<Models />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </Router>
  );
}

export default App;
