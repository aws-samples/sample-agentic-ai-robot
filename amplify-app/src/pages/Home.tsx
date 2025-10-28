import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Chip,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Psychology as PsychologyIcon,
  SmartToy as SmartToyIcon,
  AutoMode as AutoModeIcon,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'

const features = [
  {
    name: 'Agentic AI의 상황인식',
    description: '다중 센서 데이터를 실시간 분석하여 공장 내 위험 상황을 자율적으로 판단하고, 우선순위에 따른 대응 전략을 수립합니다.',
    icon: PsychologyIcon,
    color: 'primary' as const,
  },
  {
    name: 'MCP 기반 로봇 제어',
    description: 'Agentic AI가 분석한 상황 정보를 바탕으로 로봇견에 실시간 제어 신호를 전송합니다.',
    icon: SmartToyIcon,
    color: 'success' as const,
  },
  {
    name: '지능형 자율 대응',
    description: 'Agentic AI의 의사결정에 따라 MCP를 통해 위험 요소에 자동으로 대응하는 통합 안전 관리 시스템입니다',
    icon: AutoModeIcon,
    color: 'secondary' as const,
  },
]

export default function Home() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Hero section */}
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="Agentic RoboDog"
          sx={{
            width: 150,
            height: 150,
            mr: 2,
            borderRadius: '8px',
            objectFit: 'cover'
          }}
        />
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            lineHeight: 1.2,
          }}
        >
          Agentic RoboDog
        </Typography>
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            lineHeight: 1.2,
          }}
        >
          Industrial Safety Monitoring and Control via Agentic AI and MCP
        </Typography>
        <Typography
          variant="h5"
          sx={{
            mb: 4,
            opacity: 0.9,
            maxWidth: '600px',
            mx: 'auto',
            wordBreak: 'keep-all',
            whiteSpace: 'normal',
            textAlign: 'center',
          }}
        >
          Agentic AI와 MCP를 활용한 차세대 공장 안전 관리 솔루션입니다. 지능형 로봇견이 공장 내 위험 요소를 자율적으로 감지하고 대응하며,  IoT 센서 데이터와 실시간 영상 분석을 통해 사전 예방적 안전 관리를 실현합니다. AI 에이전트가 공장 상황을 종합 판단하여 로봇견의 순찰 경로와 대응 방식을 지능적으로 제어하고, 실시간 대시보드를 통해 전체 안전 상황을 통합 모니터링할 수 있습니다.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            component={Link}
            to="/agent"
            variant="contained"
            size="large"
            sx={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #ec4899 100%)',
              color: 'white',
              px: 4,
              py: 1,
              fontSize: '1.2rem',
              fontWeight: 700,
              borderRadius: 4,
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid #ec4899',
              minHeight: '56px',
              '&:hover': {
                background: 'linear-gradient(135deg, #f59e0b 0%, #db2777 100%)',
                transform: 'translateY(-3px) scale(1.05)',
                boxShadow: '0 8px 25px rgba(251, 191, 36, 0.6)',
              },
              '&:active': {
                transform: 'translateY(-1px) scale(1.02)',
              },
            }}
          >
            🤖 에이전트에게 명령
          </Button>
        </Box>
      </Paper>

      {/* Features section */}
      <Box sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip
            label="주요 기능"
            sx={{ 
              mb: 3,
              px: 3,
              py: 1,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 3,
              boxShadow: 2,
              background: 'linear-gradient(135deg, #232f3e 0%, #374151 100%)',
              color: 'white',
            }}
          />
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #232f3e 0%, #374151 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            Agentic AI 기반 안전 관리 솔루션
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ 
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: '1.1rem',
            }}
          >
            Agentic AI가 실시간 상황을 인식하고 MCP를 통해 로봇견에게 제어 명령을 내리는 시스템
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(3, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2,
            maxWidth: '1200px',
            mx: 'auto',
            px: 2,
          }}
        >
          {features.map((feature) => (
            <Card
              key={feature.name}
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: `${feature.color}.main`,
                      color: 'white',
                      mr: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 48,
                      minHeight: 48,
                      boxShadow: 2,
                    }}
                  >
                    <feature.icon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.name}
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
