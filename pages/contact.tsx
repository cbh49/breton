// pages/index.tsx
import styles from '../styles/home.module.css';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Define the matchup type if you have specific structure for matchup data
type Matchup = {
  Team2Spread: number;
  Team1Spread: number;
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
    fetch('/logos.json')
      .then(response => response.json())
      .then(data => setLogos(data))
      .catch(error => console.error('Error fetching logos:', error));

        fetch('/all_matchupsnba.json')
          .then(response => response.json())
          .then(data => {
            setMatchups(data);
            // Log team2Logo here after matchups are set
            data.forEach((matchup: { team2Logo: any; }) => {
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
            <li><Link href="/contact">CONTACT</Link></li>
          </ul>
          </div>
        <div className={styles.content}>
          <h1>CONTACT</h1>
          <p>Email charlie.hill354@gmail.com with questions/concerns</p>
          <p>Follow @breton on Twitter.</p>
        </div>
        <div className={styles.sideNav}>
          {/* Side Navigation content */}
          <div className={styles.user}>
            <Image src="/NBAlogo.png" alt="user-img" width={100} height={100} />
          </div>
          <h3>NBA GAMES TODAY</h3>
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
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Image src={logos[matchup.Team1]} alt={matchup.Team1} width={150} height={100} layout="fixed" />
                {matchup.Team1Spread < 0 && (
                <span className={styles.spreadValue}>({matchup.Team1Spread})</span>
              )}
            </div>
          )}
        </td>
        <td>@</td>
        <td>
            {logos[matchup.Team2] && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Image src={logos[matchup.Team2]} alt={matchup.Team2} width={150} height={100} layout="fixed" />
                {matchup.Team2Spread < 0 && (
                <span className={styles.spreadValue}>({matchup.Team2Spread})</span>
              )}
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