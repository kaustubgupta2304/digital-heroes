import './globals.css';
import Link from 'next/link';
export const metadata={title:'Digital Heroes — Play. Win. Give back.',description:'A modern golf performance, prize draw and charity platform.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <><header className="nav"><div className="container navin"><Link href="/" className="logo">digital<span>.heroes</span></Link><nav className="navlinks"><Link href="/#how">How it works</Link><Link href="/charities">Charities</Link><Link href="/#impact">Impact</Link></nav><div style={{display:'flex',gap:8}}><Link href="/login" className="btn ghost">Log in</Link><Link href="/signup" className="btn primary">Subscribe</Link></div></div></header>{children}</>}
