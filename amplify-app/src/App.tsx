import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useEffect, useState } from 'react'

import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Agent from './pages/Agent'
import { amplifyConfig } from './lib/amplify'
import { initializeEnvConfig } from './lib/env-config'

// Configure Amplify
Amplify.configure(amplifyConfig)

function App() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize environment configuration and authentication
    const initializeApp = async () => {
      try {
        console.log('앱 초기화 시작...')

        // 환경 설정 초기화
        await initializeEnvConfig()
        console.log('환경 설정 초기화 완료')

        // Cognito 인증 상태 확인
        try {
          const { fetchAuthSession } = await import('aws-amplify/auth')
          const session = await fetchAuthSession()
          console.log('Cognito 인증 상태:', {
            isAuthenticated: !!session.tokens,
            hasCredentials: !!session.credentials,
            identityId: session.identityId
          })
        } catch (authError) {
          console.log('인증되지 않은 상태 - 로그인 필요')
        }

        setIsInitialized(true)
        console.log('앱 초기화 완료')
      } catch (error) {
        console.error('앱 초기화 실패:', error)
        setIsInitialized(true) // 에러가 있어도 앱은 계속 실행
      }
    }

    initializeApp()
  }, [])

  if (!isInitialized) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 배경 패턴 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)
          `,
          animation: 'float 6s ease-in-out infinite'
        }} />

        {/* 로고 */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          marginBottom: '2rem',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <img
            className="logo"
            src="/logo.png"
            alt="Robot Agentic AI Logo"
            style={{
              width: '120px',
              height: '120px',
              filter: 'drop-shadow(0 8px 32px rgba(0, 0, 0, 0.3))',
              animation: 'gentle-float 3s ease-in-out infinite'
            }}
          />
        </div>

        {/* 프로젝트 제목 */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 className="title" style={{
            fontSize: '3rem',
            fontWeight: '700',
            margin: '0 0 0.5rem 0',
            background: 'linear-gradient(45deg, #fff, #e0e7ff)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            letterSpacing: '-0.02em'
          }}>
            Robot Agentic AI
          </h1>
          <p className="subtitle" style={{
            fontSize: '1.2rem',
            margin: '0',
            opacity: '0.9',
            fontWeight: '300',
            letterSpacing: '0.05em'
          }}>
            Agentic Robot Control System
          </p>
        </div>

        {/* 로딩 인디케이터 */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              animation: 'bounce 1.4s ease-in-out infinite both'
            }} />
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              animation: 'bounce 1.4s ease-in-out infinite both',
              animationDelay: '-0.16s'
            }} />
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              animation: 'bounce 1.4s ease-in-out infinite both',
              animationDelay: '-0.32s'
            }} />
          </div>

          <p className="loading-text" style={{
            fontSize: '1rem',
            margin: '0',
            opacity: '0.8',
            fontWeight: '400',
            letterSpacing: '0.02em'
          }}>
            앱을 초기화하는 중...
          </p>
        </div>

        {/* 하단 정보 */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          textAlign: 'center',
          opacity: '0.6'
        }}>
          <p className="tech-info" style={{
            fontSize: '0.9rem',
            margin: '0',
            fontWeight: '300'
          }}>
            AWS Bedrock • AgentCore • IoT Core
          </p>
        </div>

        {/* CSS 애니메이션 */}
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes gentle-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
            } 
            40% { 
              transform: scale(1);
            }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(1deg); }
            66% { transform: translateY(5px) rotate(-1deg); }
          }
          
          /* 반응형 디자인 */
          @media (max-width: 768px) {
            .loading-container .title {
              font-size: 2.2rem !important;
            }
            .loading-container .subtitle {
              font-size: 1rem !important;
            }
            .loading-container .logo {
              width: 80px !important;
              height: 80px !important;
            }
            .loading-container .tech-info {
              font-size: 0.8rem !important;
            }
          }
          
          @media (max-width: 480px) {
            .loading-container .title {
              font-size: 1.8rem !important;
            }
            .loading-container .subtitle {
              font-size: 0.9rem !important;
            }
            .loading-container .logo {
              width: 60px !important;
              height: 60px !important;
            }
            .loading-container .loading-text {
              font-size: 0.9rem !important;
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <Authenticator>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Layout>
      </Router>
    </Authenticator>
  )
}

export default App
