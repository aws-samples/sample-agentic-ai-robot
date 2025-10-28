import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Paper,
  Divider,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  PlayArrow as PlayArrowIcon,
  SmartToy as RobotIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  BatteryFull as BatteryIcon,
  Wifi as WifiIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'

// 스타일드 컴포넌트
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    borderColor: theme.palette.primary.light,
  },
}))

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  borderRadius: 12,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    width: '200%',
    height: '200%',
  },
}))

// 타입 정의
interface Task {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress?: number
  timestamp: Date
  priority: 'low' | 'medium' | 'high'
}

interface RobotStatus {
  battery: number
  connection: 'connected' | 'disconnected' | 'weak'
  location: string
  speed: number
  temperature: number
}

export default function Dashboard() {
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      name: '로봇 이동 명령',
      status: 'in_progress',
      progress: 75,
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      priority: 'high',
    },
    {
      id: '2',
      name: 'AI 명령 분석',
      status: 'completed',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      priority: 'medium',
    },
    {
      id: '3',
      name: '센서 데이터 수집',
      status: 'pending',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      priority: 'low',
    },
    {
      id: '4',
      name: '장애물 회피',
      status: 'failed',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      priority: 'high',
    },
    {
      id: '5',
      name: '사용자 응답 생성',
      status: 'completed',
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      priority: 'medium',
    },
  ])

  const [robotStatus] = useState<RobotStatus>({
    battery: 85,
    connection: 'connected',
    location: 'Building A, Floor 2',
    speed: 2.5,
    temperature: 42,
  })

  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    failedTasks: 0,
  })

  useEffect(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'completed').length
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length
    const failedTasks = tasks.filter(task => task.status === 'failed').length

    setStats({
      totalTasks,
      completedTasks,
      inProgressTasks,
      failedTasks,
    })
  }, [tasks])

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />
      case 'in_progress':
        return <PlayArrowIcon color="primary" />
      case 'pending':
        return <ScheduleIcon color="warning" />
      case 'failed':
        return <ErrorIcon color="error" />
      default:
        return null
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'primary'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary">
          로봇 제어 및 모니터링 시스템 현황
        </Typography>
      </Box>

      {/* Status section */}
      <Card elevation={1} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', }}>
            <CheckCircleIcon sx={{ color: 'success.main', mr: 1, }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              애플리케이션이 정상적으로 실행 중입니다
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <StatCard>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            {stats.totalTasks}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            총 작업 수
          </Typography>
        </StatCard>
        <Paper
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            {stats.completedTasks}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            완료된 작업
          </Typography>
        </Paper>
        <Paper
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            {stats.inProgressTasks}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            진행 중인 작업
          </Typography>
        </Paper>
        <Paper
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            {stats.failedTasks}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            실패한 작업
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* 로봇 상태 */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <RobotIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  로봇 상태
                </Typography>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BatteryIcon sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body2">배터리</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={robotStatus.battery}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {robotStatus.battery}%
                  </Typography>
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WifiIcon sx={{ mr: 1, color: robotStatus.connection === 'connected' ? 'success.main' : 'error.main' }} />
                    <Typography variant="body2">연결 상태</Typography>
                  </Box>
                  <Chip
                    label={robotStatus.connection === 'connected' ? '연결됨' : '연결 끊김'}
                    color={robotStatus.connection === 'connected' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">위치</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {robotStatus.location}
                  </Typography>
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SpeedIcon sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="body2">속도</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {robotStatus.speed} m/s
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Box>

        {/* 작업 목록 */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <SecurityIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  최근 작업
                </Typography>
              </Box>
              
              <List sx={{ p: 0 }}>
                {tasks.slice(0, 5).map((task, index) => (
                  <React.Fragment key={task.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getStatusIcon(task.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {task.name}
                            </Typography>
                            <Chip
                              label={task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                              color={getPriorityColor(task.priority) as any}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            {task.progress !== undefined && (
                              <Box sx={{ mb: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={task.progress}
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                  {task.progress}%
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Chip
                                label={task.status === 'in_progress' ? '진행중' : 
                                       task.status === 'completed' ? '완료' :
                                       task.status === 'pending' ? '대기' : '실패'}
                                color={getStatusColor(task.status) as any}
                                size="small"
                                variant={task.status === 'pending' ? 'outlined' : 'filled'}
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatTime(task.timestamp)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < 4 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </StyledCard>
        </Box>
      </Box>
    </Box>
  )
}
