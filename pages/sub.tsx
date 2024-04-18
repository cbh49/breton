// pages/index.tsx
import styles from '../styles/home.module.css';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Define the matchup type if you have specific structure for matchup data
type Matchup = {
  id: number;
  team1Logo: string;
  Team1: string;
  team2Logo: string;
  Team2: string;
};

type LogoUrls = { [team: string]: string };

const Home = () => {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [logos, setLogos] = useState<LogoUrls>({});
  const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);

  useEffect(() => {
    // Fetch the logos on component mount
    fetch('/mlblogos.json')
      .then(response => response.json())
      .then(data => setLogos(data))
      .catch(error => console.error('Error fetching logos:', error));

      fetch('/mlbmatchups.json')
      .then(response => response.json())
      .then((data: Matchup[]) => {  // Explicitly type 'data' as an array of 'Matchup'
        setMatchups(data);
        data.forEach((matchup: Matchup) => {  // Now 'matchup' is also typed as 'Matchup'
          console.log(matchup.team2Logo);
        });
      })
      .catch(error => console.error('Error fetching matchups:', error));
      }, []);

    return (
      <>
        <Head>
          <title>BRETON</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={styles.banner}>
        </div>
        <div className={styles.navbar}>
        <Link href="/" passHref><Image src="/BRETONcrl.png" alt="Logo" width={100} height={100} className={styles.logo}/></Link>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/ncaab">NCAAB</Link></li>
            <li><Link href="/nhl">NHL</Link></li>
            <li><Link href="/mlb">MLB</Link></li>
            <li 
              onMouseEnter={() => setIsNbaDropdownVisible(true)}
              onMouseLeave={() => setIsNbaDropdownVisible(false)}
            >
              <a>NBA</a>
              {isNbaDropdownVisible && (
            <div className={styles.dropdown}>
              <Link href="/nba"><p>Over/Under</p></Link>
              <Link href="/fullprop"><p>Player Props</p></Link>
              <Link href="/prop"><p>Alt Player Props</p></Link>
            </div>
          )}
          </li>
            <li><Link href="/sub">SUBSCRIBE</Link></li>
          </ul>
          </div>
        <div className={styles.content}>
        <span className={styles.span}/> 
          <h1>SUBSCRIBE</h1>
          <p>Follow @breton on Twitter.</p>
          <Link href="https://pay.bretonpicks.com" passHref>
          <button className={styles.button}>
            <span className={styles.span}/> 
            Subscribe Here
            </button></Link>
        </div>
        <div className={styles.sideNav}>
          {/* Side Navigation content */}
          <div className={styles.user}>
            <Image src="/mlb.png" alt="user-img" width={100} height={80} />
          </div>
          <h3>MLB GAMES TODAY</h3>
          <table className={styles.table}>
            {/* Table content */}
            <thead>
              <tr>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
        {matchups.length === 0 ? (
          <tr>
            <td colSpan={4}>No Games Today!</td>
          </tr>
        ) : (
        matchups.map((matchup, index) => (
          <tr key={index}>
            <td>
              {logos[matchup.Team1] && (
                  <div style={{ display: 'flex', alignItems: 'center', margin: '0 40px'  }}>
                  <Image src={logos[matchup.Team1]} alt={matchup.Team1} width={100} height={80} layout="fixed" />
            </div>
          )}
        </td>
        <td>@</td>
        <td>
            {logos[matchup.Team2] && (
                  <div style={{ display: 'flex', alignItems: 'center', margin: '0 40px'  }}>
                  <Image src={logos[matchup.Team2]} alt={matchup.Team2} width={100} height={80} layout="fixed" />
            </div>
          )}
        </td>
        <td>
          {/* Display spread value here if it applies to neither or if you wish to show something else */}
        </td>
      </tr>
    ))
  )}
</tbody>
          </table>
        </div>
      </>
    );
  };
  export default Home;