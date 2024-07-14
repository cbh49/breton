// pages/index.tsx
import styles from '../styles/news.module.css';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

// Define the matchup type if you have specific structure for matchup data
type Matchup = {
  id: number;
  team1Logo: string;
  Team1: string;
  team2Logo: string;
  Team2: string;
  Total: number;
};
type AdjMatchData = {
  Team1: string;
  Team2: string;
  Total: number;
  adj_total: number;
  difference: number;
  original_total: number;
  Team1total: number;
  Team2total: number;
  MLdifference: number;
  Team1Pitcher: string;
  Team2Pitcher: string;
};

type LogoUrls = { [team: string]: string };

const Home = () => {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [logos, setLogos] = useState<LogoUrls>({});
  const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);
  const [isMLBDropdownVisible, setIsMLBDropdownVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [adjMatchData, setAdjMatchData] = useState<AdjMatchData[]>([]);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [currentMatchupIndex, setCurrentMatchupIndex] = useState(0);
  const [displayMatchups, setDisplayMatchups] = useState<Matchup[]>([]);
  const numGames = matchups.length;
  const tableTopSpacing = `${450}px`;
  const [isLoading, setIsLoading] = useState(true);
  const [tableMarginTop, setTableMarginTop] = useState(0);

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

    // Rotating Matchups
    const handleNextGames = () => {
      setCurrentMatchupIndex(prevIndex => {
        const newIndex = prevIndex + 6;
        return newIndex >= matchups.length ? 0 : newIndex; // Resets to 0 if exceeds array length
      });
    };
    useEffect(() => {
      const newDisplayMatchups = matchups.slice(currentMatchupIndex, currentMatchupIndex + 100);
      setDisplayMatchups(newDisplayMatchups);
    }, [currentMatchupIndex, matchups]);
    


  useEffect(() => {
    if (contentRef.current) {
      const contentBottom = contentRef.current.getBoundingClientRect().bottom;
      const navbarBottom = document.querySelector('.navbar')?.getBoundingClientRect().bottom || 0;
      let newMarginTop;

      if (adjMatchData.length === 0) {
        // When there's no data, center the table on the screen
        newMarginTop = (window.innerHeight - contentBottom) / 2;
      } else {
        // When there's data, set a smaller margin
        newMarginTop = 30; // Or any other suitable value based on your design
      }

      setTableMarginTop(Math.max(newMarginTop, 30)); // Ensures that the margin is not less than 20px
    }
  }, [adjMatchData]);
    return (
      <>
        <Head>
          <title>BRETON</title>
          <link rel="icon" href="/bretpng.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale= 1, user-scalable=yes" />
        </Head>
        <div className={styles.banner}>
        </div>
        <div className={styles.navbar}>
      <Image src="/bretpngw.png" alt="Logo" width={100} height={100} className={styles.logo} />
      <Link href="/" passHref></Link>
      <ul><li><Link href="/" passHref>HOME</Link></li>
   <li
       onMouseEnter={() => setIsMLBDropdownVisible(true)}
       onMouseLeave={() => setIsMLBDropdownVisible(false)}
     >
       MLB Models
       {isMLBDropdownVisible && (
         <div className={styles.dropdown}>
          <Link href="/mlb"><p>MLB O/U</p></Link>
          <Link href="/mlbml"><p>MLB ML</p></Link>
          <Link href="/nrfi"><p>NRFI</p></Link>
         </div>
       )}
     </li>
     <li
       onMouseEnter={() => setIsMLBDropdownVisible(true)}
       onMouseLeave={() => setIsMLBDropdownVisible(false)}
     >
       MLB Props
       {isMLBDropdownVisible && (
         <div className={styles.dropdown}>
           <Link href="/pitchProp"><p>Strike Outs</p></Link>
           <Link href="/bases"><p>Total Bases</p></Link>
           <Link href="/hits"><p>Hits</p></Link>
           <Link href="/rbi"><p>RBIs</p></Link>
         </div>
       )}
     </li>
     <li><Link href="/news" passHref>AI Picks</Link></li>
   </ul>
      <div className={styles.odds}>
      <h4>Odds via:</h4>
      <Image src="/dkvert.png" alt="Logo" width={80} height={70} className={styles.logor} />
      </div>
    </div>
    <div className={styles.content2}>
      <h1>AI Picks</h1>
      <div className={styles.tableContainer2}>
        <table className={styles.stattable2}>
          
          <thead>
            <tr>
                <th colSpan={2}>
                <Image src="/ufcdenver.jpeg" width={350} height={270} alt="Article Image" className={styles.tableImage} />
                <h3>UFC Denver Best Bets</h3>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2}>
                <p>Our AI Model searched the web to find the best bets for UFC Denver <br />Published: 7/13</p>
                <button className={styles.button}><Link href="/ufcdenver"><h4>Read More</h4><span className={styles.span}/></Link>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <table className={styles.stattable1}>
          <thead>
          <tr>
                <th colSpan={2}>
                <Image src="/ufc303.jpg" width={350} height={270} alt="Article Image" className={styles.tableImage} />
                <h3>UFC 303 Best Bets</h3>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2}>
                <p>Our AI Model searched the web to find the best bets for UFC 303 <br />Published: 6/29</p>
                <button className={styles.button}><Link href="/ufc303"><h4>Read More</h4><span className={styles.span}/></Link>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    <div className={styles.tableContainer2}>
    <table className={styles.stattable2}>
          <thead>
          <tr>
            <th colSpan={2}>
                <Image src="/nbadraft.png" width={350} height={270} alt="Article Image" className={styles.tableImage} />
                <h3>2024 NBA Draft Best Bets</h3>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2}>
                <p>Our AI Model searched 10 Mock Drafts to compile the most likely outcomes. <br /> Published: 6/26</p>
                <button className={styles.button}><Link href="/nbadraft"><h4>Read More</h4><span className={styles.span}/></Link>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <table className={styles.stattable1}>
          <thead>
          <tr>
              <th colSpan={2}>
                <Image src="/mcdavid.webp" width={350} height={270} alt="Article Image" className={styles.tableImage} />
                <h3>NHL Game 7 Best Bets</h3>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2}>
                <p>Our AI Model searched to find the best bets for the deciding game in the Stanley Cup. <br /> Published: 6/24</p>
                <button className={styles.button}><Link href="/StanleyCupGame7"><h4>Read More</h4><span className={styles.span}/></Link>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    



        <div className={styles.sideNav} onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
          {/* Side Navigation content */}
          <div className={styles.leaguelogo}>
            <Image src="/mlb.webp" alt="user-img" width={110} height={60} />
          </div>
          <h3>MLB GAMES TODAY</h3>
          <table className={styles.table} style={{ top: tableTopSpacing }}>
        {/* Table content */}
        <thead>
          <tr>
          </tr>
        </thead>
              <tbody>
        {displayMatchups.length === 0 ? (
          <tr>
            <td colSpan={4}>No Games Today!</td>
          </tr>
        ) : (
          displayMatchups.map((matchup) => (
            <tr key={matchup.id} className={styles.matchupRow}>
                <Image src={logos[matchup.Team1]} alt={matchup.Team1} width={80} height={70} className={styles.navlogo} layout="fixed" />  
              <td className={styles.atSymbol}>@</td>   
                <Image src={logos[matchup.Team2]} alt={matchup.Team2} width={80} height={70} className={styles.navlogo} layout="fixed" />
              <div className={styles.total}>O/U: {matchup.Total}</div>
            </tr>
            
          ))
        )}
      </tbody>
      </table>
      {isVisible && (
    <button onClick={handleNextGames} className={styles.nextButton} title="Next Games">
    <Image
      src="/right-arrow.png" // Update with your actual image path
      alt="Next 7 Games"
      width={30} // Set appropriate width
      height={30} // Set appropriate height
    />
  </button>
  )}
  
          </div>
      </>
    );
  };
  export default Home;