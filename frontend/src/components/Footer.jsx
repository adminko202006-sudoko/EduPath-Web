const Footer = ({ className = '' }) => (
  <footer className={`border-t border-slate-200/80 px-4 py-5 text-center text-xs text-slate-500 dark:border-blue-900/50 dark:text-slate-400 ${className}`.trim()}>
    <p>© {new Date().getFullYear()} Trinidad Municipal College · EduPath</p>
    <p className="mt-1">Admission and Scholarship Management System</p>
  </footer>
);

export default Footer;
