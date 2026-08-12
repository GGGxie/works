import { Routes, Route } from 'react-router-dom';
import { Header, Footer } from './components';
import { Home, About, ProjectDetail } from './pages';
import { useConfig } from './hooks/useConfig';
import type { Config } from './types';
import './App.css';

interface AppProps {
  initialConfig?: Config;
}

function App({ initialConfig }: AppProps) {
  const { config, loading, error } = useConfig(initialConfig);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="error-screen">
        <h1>加载失败</h1>
        <p>无法加载配置文件，请稍后重试。</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home config={config} />} />
          <Route path="/projects/:id" element={<ProjectDetail config={config} />} />
          <Route path="/about" element={<About profile={config.profile} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
