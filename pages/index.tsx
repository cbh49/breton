// pages/index.tsx
import styles from '../styles/home.module.css';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Matchup = {
  id: number;
  team1Logo: string;
  team_1: string;
  team2Logo: string;
  team_2: string;
  point_total: number;
  name: string;
  rank: number;
  point_spread: number;
  fav_abb: string;
};

type Rank = {
  rank: number;
  name: string;
};

type Ranking = {
  name: string;
  imageUrl: string;
  ranks: Rank[];
};

type LogoUrls = { [team: string]: string };

type RunsData = { [team: string]: number[] };


const Home = () => {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [logos, setLogos] = useState<LogoUrls>({});
  const [currentMatchupIndex, setCurrentMatchupIndex] = useState(0);
  const [displayMatchups, setDisplayMatchups] = useState<Matchup[]>([]);
  const [isNbaDropdownVisible, setIsNbaDropdownVisible] = useState(false);
  const [isMLBDropdownVisible, setIsMLBDropdownVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);  
  const tableTopSpacing = `${100}px`;
  const [ufcNames, setUfcNames] = useState([]);
  const [runsData, setRunsData] = useState<RunsData>({}); // For runs data


  useEffect(() => {
    fetch('/nflLogos.json')
      .then(response => response.json())
      .then(data => setLogos(data))
      .catch(error => console.error('Error fetching logos:', error));

    fetch('/nflMatchups.json')
      .then(response => response.json())
      .then((data: Matchup[]) => {
        setMatchups(data);
      });

      
      // load rankings
        const loadRankings = async () => {
          try {
            const response = await fetch('/ufcrankings.json');
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
          const data = await response.json();
            console.log("Rankings data:", data);
            setRankings(data.rankings); // Ensure the JSON structure has a "rankings" key with the correct structure
            } catch (error) {
              console.error("Failed to fetch rankings:", error);
            }
          };
        
          loadRankings();
      
        const fetchUfcNames = async () => {
          try {
            const response = await fetch('/ufcnames.json');
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setUfcNames(data);
          } catch (error) {
            console.error("Failed to fetch UFC names:", error);
          }
        };
      
        fetchUfcNames();

  }, []);

    // Rotating Matchups
    const handleNextGames = () => {
      setCurrentMatchupIndex(prevIndex => {
        const newIndex = prevIndex + 6;
        return newIndex >= matchups.length ? 0 : newIndex; // Resets to 0 if exceeds array length
      });
    };
    useEffect(() => {
      const newDisplayMatchups = matchups.slice(currentMatchupIndex);
      setDisplayMatchups(newDisplayMatchups);
    }, [currentMatchupIndex, matchups]);

    // Handler to cycle through rankings
      const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % rankings.length);
      };
      // Handler to cycle through rankings
      const handlePrev = () => {
        setCurrentIndex(prevIndex => {
          // Check if the current index is 0 and wrap around to the last index if true
          return prevIndex === 0 ? rankings.length - 1 : prevIndex - 1;
        });
      };
      const getHighestRuns = () => {
        const sortedRuns = Object.entries(runsData)
          .sort(([, a], [, b]) => b[0] - a[0])
          .slice(0, 5);
        return sortedRuns;
      };
    
      const getLowestRunsAllowed = () => {
        const sortedRunsAllowed = Object.entries(runsData)
          .sort(([, a], [, b]) => a[1] - b[1])
          .slice(0, 5);
        return sortedRunsAllowed;
      };
      
    return (
      <>
        <Head>
          <title>BRETON</title>
          <link rel="icon" href="/bretpng.png" />
          <meta name="viewport" content="width=device-width, initial-scale=.99" />
        </Head>
        <div className={styles.navbar}>
   
   <Image src="/bretpngw.png" alt="Logo" width={80} height={80} className={styles.logo} />
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
   <Image src="/dkvert.png" alt="Logo" width={80} height={70} className={styles.logor}/>
   </div>
 </div>
 {/* Side Navigation content */}
 <div className={styles.sideNav} onMouseEnter={() => setIsVisible(false)} onMouseLeave={() => setIsVisible(false)}>
   <div className={styles.leaguelogo}>
     <Image src="/mlb.webp" alt="user-img"  width={110} height={60} />
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
             <Image src={logos[matchup.team_1]} alt={matchup.team_1} width={100} height={100} className={styles.navlogo} layout="fixed" />  
           <td className={styles.atSymbol}>@</td>   
             <Image src={logos[matchup.team_2]} alt={matchup.team_2} width={100} height={100} className={styles.navlogo} layout="fixed" />
             <td>
            <div className={styles.total}>O/U: {matchup.point_total}</div>
            <div className={styles.total}>{matchup.fav_abb} {matchup.point_spread}</div>
          </td>
         </tr>
         
       ))
     )}
     
   </tbody>
   </table>
   
   {isVisible && (
 <button onClick={handleNextGames} className={styles.nextButton} title="Next Games">
 <Image
   src="/right-arrow.png" // Update with your actual image path
   alt="Next 5 Games"
   width={30} // Set appropriate width
   height={30} // Set appropriate height
 />
</button>
)}</div>
            <div className={styles.banner}>
              <div className={styles.contentSection}>
            <div className={styles.tagLine}>
              <h1>Breton AI Picks</h1>
              <p>Your home for Advanced Sports Data</p>
              </div>
        </div>
      </div>          
        <>
<div className={styles.about}>
    <h2>What is Breton?</h2>
    <div className={styles.imageContainer}>
      <div className={styles.imageTextContainer}>
        <Image src="/stats.png" alt="Logo" className={styles.aboutlogo} width={175} height={150} />
        <p>Our platform pulls in advanced analytics of teams and players' recent performances. We use this data to highlight trends and identify which teams and players are currently excelling or struggling. This insight allows you to make informed decisions, understanding every matchup in depth.</p>
      </div>
      <div className={styles.imageTextContainer}>
        <Image src="/monitor.png" alt="Logo"  className={styles.aboutlogo} width={175} height={150} />
        <p>Our software is designed to adjust values based on the specific details of each matchup. By recalculating metrics with these factors in mind, we uncover deeper insights that go beyond basic statistics. This approach helps you see where opportunities might exist, giving you a clearer edge.</p>
      </div>
      <div className={styles.imageTextContainer}>
        <Image src="/money.png" alt="Logo"  className={styles.aboutlogo} width={175} height={150} />
        <p>We update and track all of our data daily, ensuring you have the latest insights at your fingertips. Use this data to identify the plays that align with your strategy, making informed decisions. While we highlight potential opportunities, the final choice is yours to make, helping you stay in control.</p>
      </div>
    </div>
  </div>
  <div className={styles.faqs}>
  <Image src="/graph.png" alt="Logo" width={80} height={60} className={styles.faqlogo} />
  <h3>PREVIOUS SEASON STATS</h3>
  <table className={styles.table3}>
    <thead>
      <tr>
        <th>Sport</th>
        <th>Results</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <span>
            <Image src={"/nba.png"}
              alt="NBA"
              width={40}
              height={50}
              style={{ marginRight: '0px' }}
            />
            Over/Under
          </span>
        </td>
        <td>65%</td>
      </tr>
      <tr>
        <td>
          <span>
            <Image src={"/NCAAb.svg"}
              alt="MM"
              width={50}
              height={50}
              style={{ marginRight: '0px' }}
            />
            Over/Under
          </span>
        </td>
        <td>63%</td>
      </tr>
    </tbody>
  </table>
</div>
{/* 
 <div className={styles.secondSideNav}>
   {rankings.length > 0 ? (
     <div>
     <div className={styles.ufclogo}>
     <Image src="/ufc.png" alt="user-img" width={125} height={40} />
   </div>
   
       <h3>STANDINGS</h3>
       <h4>{rankings[currentIndex].name}</h4>
       <tr className={styles.headshotRow}>
         <td colSpan={2}> 
           <Image
             src={rankings[currentIndex].imageUrl}
             alt={`Image for ${rankings[currentIndex].name}`}
             width={300}
             height={200}
             className={styles.headshot}
           />
         </td>
       </tr>
       
       <table className={styles.table4}>
         <thead>
         </thead>
         <tbody>
         {rankings[currentIndex].ranks.slice(0, 11).map((rank, index) => (
           <tr key={index}>
             <td>{rank.rank} {rank.name}</td>
           </tr>
         ))}
         </tbody>
       </table>
       <button onClick={handlePrev} className={styles.backButton}>
         <Image src="/left-arrow.png" alt="Next" width={80} height={80} />
       </button>
       <button onClick={handleNext} className={styles.nextButton}>
         <Image src="/right-arrow.png" alt="Next" width={80} height={80} />
       </button>
     </div>
   ) : (
     <p>Loading rankings...</p>
   )}
 </div>
 */}
 
   <div className={styles.bottomNav}>
 <Link href="https://twitter.com/BretonPicks"><Image src="/x.png" alt="Logo" width={30} height={30} className={styles.bottomnavlogo} /></Link>
 </div>
</>
      </>
    );
  };
  export default Home;