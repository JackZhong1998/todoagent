export const translations = {
  en: {
    loginModal: {
      title: 'Welcome Back',
      subtitle: 'Sign in to continue to TodoAgent',
      actionSignIn: 'Sign In',
      actionSignUp: 'Sign Up',
      promptBeforeAuth: 'Authentication is required before continuing.',
      or: 'or',
      email: 'Email address',
      continue: 'Continue',
      signUp: 'Don\'t have an account?',
      signUpLink: 'Sign up',
    },
    app: {
      all: 'ALL',
      empty: 'Nothing here / Waiting for your inspiration',
      noTitle: 'No title',
      newTodo: 'New Task',
      aiAssistant: 'AI Assistant',
    },
  },
  zh: {
    loginModal: {
      title: '欢迎回来',
      subtitle: '登录以继续使用TodoAgent',
      actionSignIn: '登录',
      actionSignUp: '注册',
      promptBeforeAuth: '继续之前需要先完成登录认证。',
      or: '或',
      email: '邮箱地址',
      continue: '继续',
      signUp: '没有账户？',
      signUpLink: '注册',
    },
    app: {
      all: '全部',
      empty: '空无一物 / 期待你的灵感',
      noTitle: '暂无标题',
      newTodo: '新任务',
      aiAssistant: 'AI 助手',
    },
  },
};

export type Language = 'en' | 'zh';
