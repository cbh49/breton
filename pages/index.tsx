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
      .then((data: Matchup[]) => { // Assert that data is of type Matchup[]
        setMatchups(data);
        data.forEach(matchup => {
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
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className={styles.banner}>
        </div>
        <div className={styles.navbar}>
        <Image src="/BRETONcrl.png" alt="Logo" width={100} height={100} className={styles.logo}/>
        <Link href="/" passHref></Link>
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
          <h1>BRETON PICKS</h1>
          <p>AI Generated betting models. Proven to pay.</p>
          <Link href="/ncaab" passHref>
            <button className={styles.button}>
            <span className={styles.span}/> 
            NCAAB
            </button>
          </Link>
          <Link href="/nhl" passHref>
            <button className={styles.button}>
            <span className={styles.span} /> 
            NHL
            </button>
          </Link>
          <Link href="/nba" passHref>
            <button className={styles.button}>
              <span className={styles.span} /> {/* This span will also have the hover effect */}
              NBA
              </button>
          </Link>
          <Link href="/prop" passHref>
            <button className={styles.button}>
            <span className={styles.span} /> {/* Repeat for each button */}
            NBA ALT PLAYER PROPS
            </button>
          </Link>
          <Link href="/fullprop" passHref>
            <button className={styles.button}>
            <span className={styles.span} /> {/* Repeat for each button */}
            NBA PLAYER PROPS
            </button>
          </Link>
          <Link href="/mlb" passHref>
            <button className={styles.button}>
            <span className={styles.span} /> {/* Repeat for each button */}
            MLB
            </button>
          </Link>
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
                  <div style={{ display: 'flex', alignItems: 'center', margin: '0 40px' }}>
                  <Image src={logos[matchup.Team1]} alt={matchup.Team1} width={100} height={80} layout="fixed" />
            </div>
          )}
        </td>
        <td>@</td>
        <td>
            {logos[matchup.Team2] && (
                  <div style={{ display: 'flex', alignItems: 'center', margin: '0 40px' }}>
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