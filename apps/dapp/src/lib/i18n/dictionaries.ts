import type { Locale } from './config';

/**
 * Diccionarios de traducción. Estructura plana por clave (`seccion.clave`).
 * Crece agregando claves acá y usando `t('clave')` (cliente con useLanguage, o
 * server con getServerT). Los nombres de categoría son datos: no se traducen.
 */
type Dictionary = Record<string, string>;

export const dictionaries: Record<Locale, Dictionary> = {
  es: {
    // Nav
    'nav.home': 'Inicio',
    'nav.projects': 'Proyectos',
    'nav.donate': 'Donar',

    // Footer
    'footer.tagline': 'De los fondos al impacto.',
    'footer.nav': 'Navegación',
    'footer.problem': 'Problema',
    'footer.howItWorks': 'Cómo funciona',
    'footer.joinList': 'Unirse a la lista',
    'footer.resources': 'Recursos',
    'footer.contact': 'Contacto',
    'footer.docs': 'Docs',
    'footer.faq': 'Preguntas frecuentes',
    'footer.social': 'Social',
    'footer.rights': 'Todos los derechos reservados.',
    'footer.Proyectos': 'Proyectos',

    // Landing — hero
    'hero.title': 'Welcome to TrustBid.',
    'hero.subtitle': "Together, we're making sure every donation reaches where it's needed most.",
    'hero.viewProjects': 'Ver proyectos',
    'hero.donate': 'Donar',
    'stats.projects': 'Proyectos',
    'stats.raised': 'Recaudado',
    'stats.spent': 'Ejecutado',
    'stats.beneficiaries': 'Beneficiarios',

    // Landing — proyectos
    'home.projectsTitle': 'Nuestros proyectos',
    'home.projectsSubtitle': 'Cada proyecto, con su trazabilidad verificable.',
    'home.viewAll': 'Ver todos',
    'carousel.prev': 'Anterior',
    'carousel.next': 'Siguiente',

    // Landing — fondos
    'funds.title': 'Cómo usamos tus fondos',
    'funds.desc':
      'Cada gasto se registra y se ancla on-chain. No tenés que confiar en nuestro reporte: lo verificás vos mismo contra la red Stellar.',
    'funds.point1': 'Trazabilidad pública de cada movimiento.',
    'funds.point2': 'Evidencia inalterable, verificable por terceros.',
    'funds.point3': 'Fondos en USDC sobre Stellar.',
    'funds.chartTitle': 'Distribución de fondos ejecutados',

    // Landing — CTA
    'cta.title': 'Tu donación, trazable de principio a fin',
    'cta.desc':
      'Elegí un proyecto y seguí cada peso hasta su ejecución, verificado en la blockchain.',
    'cta.button': 'Donar ahora',

    // Lista de proyectos
    'projects.heading': 'Proyectos activos',
    'projects.subheading': 'Explorá los proyectos y verificá el uso de cada fondo.',
    'explorer.search': 'Buscar proyectos…',
    'explorer.all': 'Todas',
    'explorer.empty': 'No encontramos proyectos con esos filtros.',

    // Card
    'card.budgetUsed': 'Presupuesto usado',
    'card.spent': 'ejecutado',
    'card.of': 'de',
    'card.reached': 'alcanzados',

    // Estados
    'status.active': 'Activo',
    'status.completed': 'Finalizado',
    'status.paused': 'Pausado',

    // Detalle
    'detail.back': 'Proyectos',
    'detail.totalBudget': 'Presupuesto total',
    'detail.spent': 'Ejecutado',
    'detail.beneficiariesReached': 'Beneficiarios alcanzados',
    'detail.executed': 'ejecutado',
    'detail.of': 'de',
    'detail.donateBtn': 'Donar a este proyecto',
    'detail.pipelineTitle': 'Pipeline del proyecto',
    'detail.traceTitle': 'Trazabilidad de fondos',
    'detail.traceSubtitle':
      'Cada movimiento anclado on-chain. Clic en el código para verificarlo en Stellar Expert.',
    'detail.impactTitle': 'Indicadores de impacto',
    'detail.impactSubtitle': 'Objetivo vs. avance real.',

    // Tabla trazabilidad
    'trace.date': 'Fecha',
    'trace.concept': 'Concepto',
    'trace.amount': 'Monto',
    'trace.code': 'Código de verificación',
    'trace.status': 'Estado',
    'trace.verified': 'Verificado',
    'trace.pending': 'Pendiente',

    // Impacto
    'impact.ofTarget': 'del objetivo',

    // Donación
    'donate.steps.amount': 'Monto',
    'donate.steps.wallet': 'Wallet',
    'donate.steps.confirm': 'Confirmar',
    'donate.steps.done': 'Listo',
    'donate.donatingTo': 'Donás a',
    'donate.chooseAmount': 'Elegí un monto (USD)',
    'donate.otherAmount': 'Otro monto',
    'donate.continue': 'Continuar',
    'donate.connectWallet': 'Conectá tu wallet de Stellar',
    'donate.walletPending':
      'La conexión de wallet todavía no está habilitada. Podés continuar: la donación queda registrada como pendiente y se confirma on-chain desde el backend.',
    'donate.walletError': 'No se pudo conectar la wallet. Probá de nuevo.',
    'donate.back': 'Atrás',
    'donate.continueNoWallet': 'Continuar sin wallet',
    'donate.confirmTitle': 'Confirmá tu donación',
    'donate.project': 'Proyecto',
    'donate.amount': 'Monto',
    'donate.network': 'Red',
    'donate.wallet': 'Wallet',
    'donate.walletUnset': 'Sin conectar (pendiente)',
    'donate.confirmBtn': 'Confirmar donación',
    'donate.processing': 'Procesando…',
    'donate.successTitle': '¡Gracias por tu donación!',
    'donate.successFor': 'para',
    'donate.verificationCode': 'Código de verificación',
    'donate.codePending': 'Pendiente de confirmación on-chain',
    'donate.reference': 'Referencia',
    'donate.viewProject': 'Ver el proyecto',
    'donate.viewOthers': 'Ver otros proyectos',
    'donate.amountRequired': 'Ingresá un monto',
    'donate.amountPositive': 'El monto debe ser mayor a 0',
    'donate.amountTooHigh': 'Monto demasiado alto',
    'donate.submitError': 'No se pudo registrar la donación.',
  },
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.donate': 'Donate',

    // Footer
    'footer.tagline': 'From funds to impact.',
    'footer.nav': 'Navigation',
    'footer.problem': 'Problem',
    'footer.howItWorks': 'How it works',
    'footer.joinList': 'Join waitlist',
    'footer.resources': 'Resources',
    'footer.contact': 'Contact',
    'footer.docs': 'Docs',
    'footer.faq': 'FAQ',
    'footer.social': 'Social',
    'footer.rights': 'All rights reserved.',

    // Landing — hero
    'hero.title': 'Welcome to TrustBid.',
    'hero.subtitle': "Together, we're making sure every donation reaches where it's needed most.",
    'hero.viewProjects': 'View projects',
    'hero.donate': 'Donate',
    'stats.projects': 'Projects',
    'stats.raised': 'Raised',
    'stats.spent': 'Spent',
    'stats.beneficiaries': 'Beneficiaries',

    // Landing — projects
    'home.projectsTitle': 'Our projects',
    'home.projectsSubtitle': 'Every project, with verifiable traceability.',
    'home.viewAll': 'View all',
    'carousel.prev': 'Previous',
    'carousel.next': 'Next',

    // Landing — funds
    'funds.title': 'How we use your funds',
    'funds.desc':
      'Every expense is recorded and anchored on-chain. You don’t have to trust our report — verify it yourself against the Stellar network.',
    'funds.point1': 'Public traceability of every movement.',
    'funds.point2': 'Tamper-proof evidence, verifiable by third parties.',
    'funds.point3': 'Funds in USDC on Stellar.',
    'funds.chartTitle': 'Executed funds breakdown',

    // Landing — CTA
    'cta.title': 'Your donation, traceable end to end',
    'cta.desc':
      'Pick a project and follow every dollar through to execution, verified on the blockchain.',
    'cta.button': 'Donate now',

    // Projects list
    'projects.heading': 'Active projects',
    'projects.subheading': 'Explore the projects and verify how every fund is used.',
    'explorer.search': 'Search projects…',
    'explorer.all': 'All',
    'explorer.empty': 'No projects match those filters.',

    // Card
    'card.budgetUsed': 'Budget used',
    'card.spent': 'spent',
    'card.of': 'of',
    'card.reached': 'reached',

    // Status
    'status.active': 'Active',
    'status.completed': 'Completed',
    'status.paused': 'Paused',

    // Detail
    'detail.back': 'Projects',
    'detail.totalBudget': 'Total budget',
    'detail.spent': 'Spent',
    'detail.beneficiariesReached': 'Beneficiaries reached',
    'detail.executed': 'executed',
    'detail.of': 'of',
    'detail.donateBtn': 'Donate to this project',
    'detail.pipelineTitle': 'Project pipeline',
    'detail.traceTitle': 'Fund traceability',
    'detail.traceSubtitle':
      'Every movement anchored on-chain. Click the code to verify it on Stellar Expert.',
    'detail.impactTitle': 'Impact indicators',
    'detail.impactSubtitle': 'Target vs. actual progress.',

    // Traceability table
    'trace.date': 'Date',
    'trace.concept': 'Concept',
    'trace.amount': 'Amount',
    'trace.code': 'Verification code',
    'trace.status': 'Status',
    'trace.verified': 'Verified',
    'trace.pending': 'Pending',

    // Impact
    'impact.ofTarget': 'of target',

    // Donation
    'donate.steps.amount': 'Amount',
    'donate.steps.wallet': 'Wallet',
    'donate.steps.confirm': 'Confirm',
    'donate.steps.done': 'Done',
    'donate.donatingTo': 'You are donating to',
    'donate.chooseAmount': 'Choose an amount (USD)',
    'donate.otherAmount': 'Other amount',
    'donate.continue': 'Continue',
    'donate.connectWallet': 'Connect your Stellar wallet',
    'donate.walletPending':
      'Wallet connection is not enabled yet. You can continue: the donation is recorded as pending and confirmed on-chain from the backend.',
    'donate.walletError': 'Could not connect the wallet. Please try again.',
    'donate.back': 'Back',
    'donate.continueNoWallet': 'Continue without wallet',
    'donate.confirmTitle': 'Confirm your donation',
    'donate.project': 'Project',
    'donate.amount': 'Amount',
    'donate.network': 'Network',
    'donate.wallet': 'Wallet',
    'donate.walletUnset': 'Not connected (pending)',
    'donate.confirmBtn': 'Confirm donation',
    'donate.processing': 'Processing…',
    'donate.successTitle': 'Thank you for your donation!',
    'donate.successFor': 'for',
    'donate.verificationCode': 'Verification code',
    'donate.codePending': 'Pending on-chain confirmation',
    'donate.reference': 'Reference',
    'donate.viewProject': 'View the project',
    'donate.viewOthers': 'View other projects',
    'donate.amountRequired': 'Enter an amount',
    'donate.amountPositive': 'Amount must be greater than 0',
    'donate.amountTooHigh': 'Amount too high',
    'donate.submitError': 'Could not register the donation.',
  },
};
