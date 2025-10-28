import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1', // 인디고-600
      light: '#a5b4fc', // 인디고-300
      dark: '#4f46e5', // 인디고-700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8b5cf6', // 바이올렛-500
      light: '#c4b5fd', // 바이올렛-300
      dark: '#7c3aed', // 바이올렛-600
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981', // 에메랄드-500
      light: '#6ee7b7', // 에메랄드-300
      dark: '#059669', // 에메랄드-600
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b', // 앰버-500
      light: '#fcd34d', // 앰버-300
      dark: '#d97706', // 앰버-600
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444', // 레드-500
      light: '#fca5a5', // 레드-300
      dark: '#dc2626', // 레드-600
      contrastText: '#ffffff',
    },
    info: {
      main: '#06b6d4', // 시안-500
      light: '#67e8f9', // 시안-300
      dark: '#0891b2', // 시안-600
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // 슬레이트-50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // 슬레이트-900
      secondary: '#64748b', // 슬레이트-500
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '12px 24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: 'rgba(99, 102, 241, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderRadius: 16,
          border: '2px solid rgba(203, 213, 225, 0.9)',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
        },
        colorSuccess: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
        },
        colorWarning: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
        },
        colorError: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
        },
        bar: {
          borderRadius: 4,
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
        },
      },
    },
  },
});

export default theme;
