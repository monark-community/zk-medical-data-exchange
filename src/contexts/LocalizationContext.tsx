
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja';

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'nav.home': 'Home',
    'nav.research': 'Research',
    'nav.breakthroughs': 'Breakthroughs',
    'nav.dashboard': 'Dashboard',
    'nav.governance': 'Governance',
    'nav.howItWorks': 'How it Works',
    'nav.connectWallet': 'Connect Wallet',
    'nav.switchTo': 'Switch to',
    'nav.dataSeller': 'Data Seller',
    'nav.researcher': 'Researcher',
    'nav.profile': 'Profile',
    'nav.disconnect': 'Disconnect',
    
    // Hero Section
    'hero.badge': 'Powered by Zero-Knowledge Proofs & Midnight Network',
    'hero.title': 'Your Medical Data,',
    'hero.titleHighlight': ' Your Control',
    'hero.description': 'Securely share, sell, or donate your anonymized medical data for research and AI development. Earn rewards while advancing medical science — all with complete privacy protection.',
    'hero.connectData': 'Connect my Data',
    'hero.howItWorks': 'How it Works',
    'hero.feature1': 'Complete anonymity guaranteed',
    'hero.feature2': 'Fair compensation for your data',
    'hero.feature3': 'Full transparency in research impact',
    'hero.feature4': 'Equal voice in platform decisions',
    'hero.stats.contributors': 'Data Contributors',
    'hero.stats.projects': 'Research Projects',
    'hero.stats.rewards': 'Distributed Rewards',
    'hero.stats.privacy': 'Privacy Guaranteed',
    
    // Footer
    'footer.description': 'Empowering individuals to securely share medical data for research while maintaining complete privacy and control.',
    'footer.platform': 'Platform',
    'footer.research': 'Research',
    'footer.community': 'Community',
    'footer.howItWorks': 'How it Works',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.termsOfService': 'Terms of Service',
    'footer.security': 'Security',
    'footer.forResearchers': 'For Researchers',
    'footer.dataCatalog': 'Data Catalog',
    'footer.apiDocumentation': 'API Documentation',
    'footer.ethicsGuidelines': 'Ethics Guidelines',
    'footer.daoGovernance': 'DAO Governance',
    'footer.forum': 'Forum',
    'footer.blog': 'Blog',
    'footer.support': 'Support',
    'footer.copyright': '© 2024 Cura. All rights reserved. Built with privacy by design.',
    'footer.poweredBy': 'Powered by',
    'footer.language': 'Language',
    
    // Profile
    'profile.title': 'HealthUser123',
    'profile.dataSeller': 'Data Seller',
    'profile.connected': 'Connected',
    'profile.accountSettings': 'Account Settings',
    'profile.activitySummary': 'Activity Summary',
    'profile.userPreferences': 'User Preferences',
    'profile.walletAddress': 'Wallet Address',
    'profile.userAlias': 'User Alias',
    'profile.accountType': 'Account Type',
    'profile.dataContributions': 'Data Contributions',
    'profile.datasetsShared': 'Datasets shared',
    'profile.earnings': 'Earnings',
    'profile.totalRewards': 'Total rewards earned',
    'profile.privacyScore': 'Privacy Score',
    'profile.dataProtected': 'Data always protected',
    'profile.editProfile': 'Edit Profile',
    'profile.privacySettings': 'Privacy Settings',
    'profile.downloadData': 'Download Data',
    'profile.language': 'Language',
    'profile.languageDescription': 'Choose your preferred language'
  },
  es: {
    // Header
    'nav.home': 'Inicio',
    'nav.research': 'Investigación',
    'nav.breakthroughs': 'Avances',
    'nav.dashboard': 'Panel',
    'nav.governance': 'Gobernanza',
    'nav.howItWorks': 'Cómo Funciona',
    'nav.connectWallet': 'Conectar Billetera',
    'nav.switchTo': 'Cambiar a',
    'nav.dataSeller': 'Vendedor de Datos',
    'nav.researcher': 'Investigador',
    'nav.profile': 'Perfil',
    'nav.disconnect': 'Desconectar',
    
    // Hero Section
    'hero.badge': 'Impulsado por Pruebas de Conocimiento Cero y Midnight Network',
    'hero.title': 'Tus Datos Médicos,',
    'hero.titleHighlight': ' Tu Control',
    'hero.description': 'Comparte, vende o dona de forma segura tus datos médicos anonimizados para investigación y desarrollo de IA. Gana recompensas mientras avanzas la ciencia médica — todo con protección completa de privacidad.',
    'hero.connectData': 'Conectar mis Datos',
    'hero.howItWorks': 'Cómo Funciona',
    'hero.feature1': 'Anonimato completo garantizado',
    'hero.feature2': 'Compensación justa por tus datos',
    'hero.feature3': 'Transparencia total en el impacto de la investigación',
    'hero.feature4': 'Voz igualitaria en las decisiones de la plataforma',
    'hero.stats.contributors': 'Contribuidores de Datos',
    'hero.stats.projects': 'Proyectos de Investigación',
    'hero.stats.rewards': 'Recompensas Distribuidas',
    'hero.stats.privacy': 'Privacidad Garantizada',
    
    // Footer
    'footer.description': 'Empoderando a individuos para compartir datos médicos de forma segura para investigación mientras mantienen completa privacidad y control.',
    'footer.platform': 'Plataforma',
    'footer.research': 'Investigación',
    'footer.community': 'Comunidad',
    'footer.howItWorks': 'Cómo Funciona',
    'footer.privacyPolicy': 'Política de Privacidad',
    'footer.termsOfService': 'Términos de Servicio',
    'footer.security': 'Seguridad',
    'footer.forResearchers': 'Para Investigadores',
    'footer.dataCatalog': 'Catálogo de Datos',
    'footer.apiDocumentation': 'Documentación API',
    'footer.ethicsGuidelines': 'Guías Éticas',
    'footer.daoGovernance': 'Gobernanza DAO',
    'footer.forum': 'Foro',
    'footer.blog': 'Blog',
    'footer.support': 'Soporte',
    'footer.copyright': '© 2024 Cura. Todos los derechos reservados. Construido con privacidad por diseño.',
    'footer.poweredBy': 'Impulsado por',
    'footer.language': 'Idioma',
    
    // Profile
    'profile.title': 'UsuarioSalud123',
    'profile.dataSeller': 'Vendedor de Datos',
    'profile.connected': 'Conectado',
    'profile.accountSettings': 'Configuración de Cuenta',
    'profile.activitySummary': 'Resumen de Actividad',
    'profile.userPreferences': 'Preferencias de Usuario',
    'profile.walletAddress': 'Dirección de Billetera',
    'profile.userAlias': 'Alias de Usuario',
    'profile.accountType': 'Tipo de Cuenta',
    'profile.dataContributions': 'Contribuciones de Datos',
    'profile.datasetsShared': 'Conjuntos de datos compartidos',
    'profile.earnings': 'Ganancias',
    'profile.totalRewards': 'Recompensas totales ganadas',
    'profile.privacyScore': 'Puntuación de Privacidad',
    'profile.dataProtected': 'Datos siempre protegidos',
    'profile.editProfile': 'Editar Perfil',
    'profile.privacySettings': 'Configuración de Privacidad',
    'profile.downloadData': 'Descargar Datos',
    'profile.language': 'Idioma',
    'profile.languageDescription': 'Elige tu idioma preferido'
  },
  fr: {
    // Header
    'nav.home': 'Accueil',
    'nav.research': 'Recherche',
    'nav.breakthroughs': 'Percées',
    'nav.dashboard': 'Tableau de bord',
    'nav.governance': 'Gouvernance',
    'nav.howItWorks': 'Comment ça marche',
    'nav.connectWallet': 'Connecter le portefeuille',
    'nav.switchTo': 'Basculer vers',
    'nav.dataSeller': 'Vendeur de données',
    'nav.researcher': 'Chercheur',
    'nav.profile': 'Profil',
    'nav.disconnect': 'Déconnecter',
    
    // Hero Section
    'hero.badge': 'Alimenté par les preuves à divulgation nulle et Midnight Network',
    'hero.title': 'Vos données médicales,',
    'hero.titleHighlight': ' Votre contrôle',
    'hero.description': 'Partagez, vendez ou donnez en toute sécurité vos données médicales anonymisées pour la recherche et le développement IA. Gagnez des récompenses tout en faisant progresser la science médicale — le tout avec une protection complète de la vie privée.',
    'hero.connectData': 'Connecter mes données',
    'hero.howItWorks': 'Comment ça marche',
    'hero.feature1': 'Anonymat complet garanti',
    'hero.feature2': 'Compensation équitable pour vos données',
    'hero.feature3': 'Transparence totale sur l\'impact de la recherche',
    'hero.feature4': 'Voix égale dans les décisions de plateforme',
    'hero.stats.contributors': 'Contributeurs de données',
    'hero.stats.projects': 'Projets de recherche',
    'hero.stats.rewards': 'Récompenses distribuées',
    'hero.stats.privacy': 'Confidentialité garantie',
    
    // Footer
    'footer.description': 'Donner aux individus les moyens de partager en toute sécurité des données médicales pour la recherche tout en maintenant une confidentialité et un contrôle complets.',
    'footer.platform': 'Plateforme',
    'footer.research': 'Recherche',
    'footer.community': 'Communauté',
    'footer.howItWorks': 'Comment ça marche',
    'footer.privacyPolicy': 'Politique de confidentialité',
    'footer.termsOfService': 'Conditions de service',
    'footer.security': 'Sécurité',
    'footer.forResearchers': 'Pour les chercheurs',
    'footer.dataCatalog': 'Catalogue de données',
    'footer.apiDocumentation': 'Documentation API',
    'footer.ethicsGuidelines': 'Directives éthiques',
    'footer.daoGovernance': 'Gouvernance DAO',
    'footer.forum': 'Forum',
    'footer.blog': 'Blog',
    'footer.support': 'Support',
    'footer.copyright': '© 2024 Cura. Tous droits réservés. Construit avec la confidentialité par conception.',
    'footer.poweredBy': 'Alimenté par',
    'footer.language': 'Langue',
    
    // Profile
    'profile.title': 'UtilisateurSanté123',
    'profile.dataSeller': 'Vendeur de données',
    'profile.connected': 'Connecté',
    'profile.accountSettings': 'Paramètres du compte',
    'profile.activitySummary': 'Résumé d\'activité',
    'profile.userPreferences': 'Préférences utilisateur',
    'profile.walletAddress': 'Adresse du portefeuille',
    'profile.userAlias': 'Alias utilisateur',
    'profile.accountType': 'Type de compte',
    'profile.dataContributions': 'Contributions de données',
    'profile.datasetsShared': 'Ensembles de données partagés',
    'profile.earnings': 'Gains',
    'profile.totalRewards': 'Récompenses totales gagnées',
    'profile.privacyScore': 'Score de confidentialité',
    'profile.dataProtected': 'Données toujours protégées',
    'profile.editProfile': 'Modifier le profil',
    'profile.privacySettings': 'Paramètres de confidentialité',
    'profile.downloadData': 'Télécharger les données',
    'profile.language': 'Langue',
    'profile.languageDescription': 'Choisissez votre langue préférée'
  },
  de: {
    // Header
    'nav.home': 'Startseite',
    'nav.research': 'Forschung',
    'nav.breakthroughs': 'Durchbrüche',
    'nav.dashboard': 'Dashboard',
    'nav.governance': 'Governance',
    'nav.howItWorks': 'Wie es funktioniert',
    'nav.connectWallet': 'Wallet verbinden',
    'nav.switchTo': 'Wechseln zu',
    'nav.dataSeller': 'Datenverkäufer',
    'nav.researcher': 'Forscher',
    'nav.profile': 'Profil',
    'nav.disconnect': 'Trennen',
    
    // Hero Section
    'hero.badge': 'Powered by Zero-Knowledge-Proofs & Midnight Network',
    'hero.title': 'Ihre medizinischen Daten,',
    'hero.titleHighlight': ' Ihre Kontrolle',
    'hero.description': 'Teilen, verkaufen oder spenden Sie sicher Ihre anonymisierten medizinischen Daten für Forschung und KI-Entwicklung. Verdienen Sie Belohnungen und fördern Sie die medizinische Wissenschaft — alles mit vollständigem Datenschutz.',
    'hero.connectData': 'Meine Daten verbinden',
    'hero.howItWorks': 'Wie es funktioniert',
    'hero.feature1': 'Vollständige Anonymität garantiert',
    'hero.feature2': 'Faire Vergütung für Ihre Daten',
    'hero.feature3': 'Vollständige Transparenz bei Forschungsauswirkungen',
    'hero.feature4': 'Gleichberechtigte Stimme bei Plattformentscheidungen',
    'hero.stats.contributors': 'Daten-Beitragende',
    'hero.stats.projects': 'Forschungsprojekte',
    'hero.stats.rewards': 'Verteilte Belohnungen',
    'hero.stats.privacy': 'Datenschutz garantiert',
    
    // Footer
    'footer.description': 'Befähigung von Einzelpersonen, medizinische Daten sicher für Forschung zu teilen, während vollständige Privatsphäre und Kontrolle gewährleistet werden.',
    'footer.platform': 'Plattform',
    'footer.research': 'Forschung',
    'footer.community': 'Gemeinschaft',
    'footer.howItWorks': 'Wie es funktioniert',
    'footer.privacyPolicy': 'Datenschutzrichtlinie',
    'footer.termsOfService': 'Nutzungsbedingungen',
    'footer.security': 'Sicherheit',
    'footer.forResearchers': 'Für Forscher',
    'footer.dataCatalog': 'Datenkatalog',
    'footer.apiDocumentation': 'API-Dokumentation',
    'footer.ethicsGuidelines': 'Ethik-Richtlinien',
    'footer.daoGovernance': 'DAO-Governance',
    'footer.forum': 'Forum',
    'footer.blog': 'Blog',
    'footer.support': 'Support',
    'footer.copyright': '© 2024 Cura. Alle Rechte vorbehalten. Mit Datenschutz by Design entwickelt.',
    'footer.poweredBy': 'Powered by',
    'footer.language': 'Sprache',
    
    // Profile
    'profile.title': 'GesundheitsUser123',
    'profile.dataSeller': 'Datenverkäufer',
    'profile.connected': 'Verbunden',
    'profile.accountSettings': 'Kontoeinstellungen',
    'profile.activitySummary': 'Aktivitätszusammenfassung',
    'profile.userPreferences': 'Benutzereinstellungen',
    'profile.walletAddress': 'Wallet-Adresse',
    'profile.userAlias': 'Benutzer-Alias',
    'profile.accountType': 'Kontotyp',
    'profile.dataContributions': 'Datenbeiträge',
    'profile.datasetsShared': 'Geteilte Datensätze',
    'profile.earnings': 'Verdienste',
    'profile.totalRewards': 'Gesamte verdiente Belohnungen',
    'profile.privacyScore': 'Datenschutz-Score',
    'profile.dataProtected': 'Daten immer geschützt',
    'profile.editProfile': 'Profil bearbeiten',
    'profile.privacySettings': 'Datenschutzeinstellungen',
    'profile.downloadData': 'Daten herunterladen',
    'profile.language': 'Sprache',
    'profile.languageDescription': 'Wählen Sie Ihre bevorzugte Sprache'
  },
  pt: {
    // Header
    'nav.home': 'Início',
    'nav.research': 'Pesquisa',
    'nav.breakthroughs': 'Avanços',
    'nav.dashboard': 'Painel',
    'nav.governance': 'Governança',
    'nav.howItWorks': 'Como Funciona',
    'nav.connectWallet': 'Conectar Carteira',
    'nav.switchTo': 'Mudar para',
    'nav.dataSeller': 'Vendedor de Dados',
    'nav.researcher': 'Pesquisador',
    'nav.profile': 'Perfil',
    'nav.disconnect': 'Desconectar',
    
    // Hero Section
    'hero.badge': 'Powered by Provas de Conhecimento Zero & Midnight Network',
    'hero.title': 'Seus Dados Médicos,',
    'hero.titleHighlight': ' Seu Controle',
    'hero.description': 'Compartilhe, venda ou doe com segurança seus dados médicos anonimizados para pesquisa e desenvolvimento de IA. Ganhe recompensas enquanto avança a ciência médica — tudo com proteção completa de privacidade.',
    'hero.connectData': 'Conectar meus Dados',
    'hero.howItWorks': 'Como Funciona',
    'hero.feature1': 'Anonimato completo garantido',
    'hero.feature2': 'Compensação justa pelos seus dados',
    'hero.feature3': 'Transparência total no impacto da pesquisa',
    'hero.feature4': 'Voz igual nas decisões da plataforma',
    'hero.stats.contributors': 'Contribuidores de Dados',
    'hero.stats.projects': 'Projetos de Pesquisa',
    'hero.stats.rewards': 'Recompensas Distribuídas',
    'hero.stats.privacy': 'Privacidade Garantida',
    
    // Footer
    'footer.description': 'Capacitando indivíduos para compartilhar dados médicos com segurança para pesquisa enquanto mantêm privacidade e controle completos.',
    'footer.platform': 'Plataforma',
    'footer.research': 'Pesquisa',
    'footer.community': 'Comunidade',
    'footer.howItWorks': 'Como Funciona',
    'footer.privacyPolicy': 'Política de Privacidade',
    'footer.termsOfService': 'Termos de Serviço',
    'footer.security': 'Segurança',
    'footer.forResearchers': 'Para Pesquisadores',
    'footer.dataCatalog': 'Catálogo de Dados',
    'footer.apiDocumentation': 'Documentação da API',
    'footer.ethicsGuidelines': 'Diretrizes Éticas',
    'footer.daoGovernance': 'Governança DAO',
    'footer.forum': 'Fórum',
    'footer.blog': 'Blog',
    'footer.support': 'Suporte',
    'footer.copyright': '© 2024 Cura. Todos os direitos reservados. Construído com privacidade por design.',
    'footer.poweredBy': 'Powered by',
    'footer.language': 'Idioma',
    
    // Profile
    'profile.title': 'UsuárioSaúde123',
    'profile.dataSeller': 'Vendedor de Dados',
    'profile.connected': 'Conectado',
    'profile.accountSettings': 'Configurações da Conta',
    'profile.activitySummary': 'Resumo da Atividade',
    'profile.userPreferences': 'Preferências do Usuário',
    'profile.walletAddress': 'Endereço da Carteira',
    'profile.userAlias': 'Alias do Usuário',
    'profile.accountType': 'Tipo de Conta',
    'profile.dataContributions': 'Contribuições de Dados',
    'profile.datasetsShared': 'Conjuntos de dados compartilhados',
    'profile.earnings': 'Ganhos',
    'profile.totalRewards': 'Recompensas totais ganhas',
    'profile.privacyScore': 'Pontuação de Privacidade',
    'profile.dataProtected': 'Dados sempre protegidos',
    'profile.editProfile': 'Editar Perfil',
    'profile.privacySettings': 'Configurações de Privacidade',
    'profile.downloadData': 'Baixar Dados',
    'profile.language': 'Idioma',
    'profile.languageDescription': 'Escolha seu idioma preferido'
  },
  zh: {
    // Header
    'nav.home': '首页',
    'nav.research': '研究',
    'nav.breakthroughs': '突破',
    'nav.dashboard': '仪表板',
    'nav.governance': '治理',
    'nav.howItWorks': '工作原理',
    'nav.connectWallet': '连接钱包',
    'nav.switchTo': '切换到',
    'nav.dataSeller': '数据销售者',
    'nav.researcher': '研究员',
    'nav.profile': '个人资料',
    'nav.disconnect': '断开连接',
    
    // Hero Section
    'hero.badge': '由零知识证明和Midnight网络提供支持',
    'hero.title': '您的医疗数据，',
    'hero.titleHighlight': ' 您的控制',
    'hero.description': '安全地分享、出售或捐献您匿名化的医疗数据用于研究和AI开发。在推进医学科学的同时获得奖励——所有这些都有完整的隐私保护。',
    'hero.connectData': '连接我的数据',
    'hero.howItWorks': '工作原理',
    'hero.feature1': '保证完全匿名',
    'hero.feature2': '数据的公平补偿',
    'hero.feature3': '研究影响的完全透明',
    'hero.feature4': '平台决策中的平等发言权',
    'hero.stats.contributors': '数据贡献者',
    'hero.stats.projects': '研究项目',
    'hero.stats.rewards': '分发的奖励',
    'hero.stats.privacy': '隐私保证',
    
    // Footer
    'footer.description': '赋能个人安全地分享医疗数据用于研究，同时保持完整的隐私和控制。',
    'footer.platform': '平台',
    'footer.research': '研究',
    'footer.community': '社区',
    'footer.howItWorks': '工作原理',
    'footer.privacyPolicy': '隐私政策',
    'footer.termsOfService': '服务条款',
    'footer.security': '安全',
    'footer.forResearchers': '面向研究人员',
    'footer.dataCatalog': '数据目录',
    'footer.apiDocumentation': 'API文档',
    'footer.ethicsGuidelines': '道德准则',
    'footer.daoGovernance': 'DAO治理',
    'footer.forum': '论坛',
    'footer.blog': '博客',
    'footer.support': '支持',
    'footer.copyright': '© 2024 Cura. 保留所有权利。以隐私为设计理念构建。',
    'footer.poweredBy': '技术支持',
    'footer.language': '语言',
    
    // Profile
    'profile.title': '健康用户123',
    'profile.dataSeller': '数据销售者',
    'profile.connected': '已连接',
    'profile.accountSettings': '账户设置',
    'profile.activitySummary': '活动摘要',
    'profile.userPreferences': '用户偏好',
    'profile.walletAddress': '钱包地址',
    'profile.userAlias': '用户别名',
    'profile.accountType': '账户类型',
    'profile.dataContributions': '数据贡献',
    'profile.datasetsShared': '共享的数据集',
    'profile.earnings': '收益',
    'profile.totalRewards': '总奖励收入',
    'profile.privacyScore': '隐私评分',
    'profile.dataProtected': '数据始终受保护',
    'profile.editProfile': '编辑个人资料',
    'profile.privacySettings': '隐私设置',
    'profile.downloadData': '下载数据',
    'profile.language': '语言',
    'profile.languageDescription': '选择您的首选语言'
  },
  ja: {
    // Header
    'nav.home': 'ホーム',
    'nav.research': '研究',
    'nav.breakthroughs': 'ブレークスルー',
    'nav.dashboard': 'ダッシュボード',
    'nav.governance': 'ガバナンス',
    'nav.howItWorks': '仕組み',
    'nav.connectWallet': 'ウォレット接続',
    'nav.switchTo': '切り替え',
    'nav.dataSeller': 'データ販売者',
    'nav.researcher': '研究者',
    'nav.profile': 'プロフィール',
    'nav.disconnect': '切断',
    
    // Hero Section
    'hero.badge': 'ゼロ知識証明とMidnight Networkによる支援',
    'hero.title': 'あなたの医療データ、',
    'hero.titleHighlight': ' あなたのコントロール',
    'hero.description': '研究とAI開発のために匿名化された医療データを安全に共有、販売、または寄付してください。医学科学を進歩させながら報酬を獲得 — すべて完全なプライバシー保護付き。',
    'hero.connectData': 'データを接続',
    'hero.howItWorks': '仕組み',
    'hero.feature1': '完全な匿名性を保証',
    'hero.feature2': 'データの公正な補償',
    'hero.feature3': '研究インパクトの完全な透明性',
    'hero.feature4': 'プラットフォーム決定における平等な発言権',
    'hero.stats.contributors': 'データ提供者',
    'hero.stats.projects': '研究プロジェクト',
    'hero.stats.rewards': '配布された報酬',
    'hero.stats.privacy': 'プライバシー保証',
    
    // Footer
    'footer.description': '完全なプライバシーとコントロールを維持しながら、個人が研究のために医療データを安全に共有できるよう支援します。',
    'footer.platform': 'プラットフォーム',
    'footer.research': '研究',
    'footer.community': 'コミュニティ',
    'footer.howItWorks': '仕組み',
    'footer.privacyPolicy': 'プライバシーポリシー',
    'footer.termsOfService': '利用規約',
    'footer.security': 'セキュリティ',
    'footer.forResearchers': '研究者向け',
    'footer.dataCatalog': 'データカタログ',
    'footer.apiDocumentation': 'APIドキュメント',
    'footer.ethicsGuidelines': '倫理ガイドライン',
    'footer.daoGovernance': 'DAOガバナンス',
    'footer.forum': 'フォーラム',
    'footer.blog': 'ブログ',
    'footer.support': 'サポート',
    'footer.copyright': '© 2024 Cura. All rights reserved. プライバシーバイデザインで構築。',
    'footer.poweredBy': 'Powered by',
    'footer.language': '言語',
    
    // Profile
    'profile.title': 'ヘルスユーザー123',
    'profile.dataSeller': 'データ販売者',
    'profile.connected': '接続済み',
    'profile.accountSettings': 'アカウント設定',
    'profile.activitySummary': 'アクティビティサマリー',
    'profile.userPreferences': 'ユーザー設定',
    'profile.walletAddress': 'ウォレットアドレス',
    'profile.userAlias': 'ユーザーエイリアス',
    'profile.accountType': 'アカウントタイプ',
    'profile.dataContributions': 'データ貢献',
    'profile.datasetsShared': '共有されたデータセット',
    'profile.earnings': '収益',
    'profile.totalRewards': '獲得した総報酬',
    'profile.privacyScore': 'プライバシースコア',
    'profile.dataProtected': 'データは常に保護',
    'profile.editProfile': 'プロフィール編集',
    'profile.privacySettings': 'プライバシー設定',
    'profile.downloadData': 'データダウンロード',
    'profile.language': '言語',
    'profile.languageDescription': '希望する言語を選択'
  }
};

const languageNames = {
  en: 'English',
  es: 'Español',
  fr: 'Français', 
  de: 'Deutsch',
  pt: 'Português',
  zh: '中文',
  ja: '日本語'
};

const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  return (Object.keys(translations).includes(browserLang) ? browserLang : 'en') as Language;
};

const getCookieLanguage = (): Language | null => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'cura-language') {
      return value as Language;
    }
  }
  return null;
};

const setCookieLanguage = (language: Language) => {
  document.cookie = `cura-language=${language}; path=/; max-age=31536000`; // 1 year
};

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return getCookieLanguage() || detectBrowserLanguage();
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setCookieLanguage(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

export { languageNames };
export type { Language };
