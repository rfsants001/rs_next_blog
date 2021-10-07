import Link from 'next/link';

import styles from './header.module.scss';


export default function Header() {
  return(      
      <div className={styles.header}>
        <Link href={'/'} >
          <img src='/img/Logo.svg' alt="logo" />
        </Link>
      </div>

  )
}
