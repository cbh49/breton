// pages/index.tsx
import styles from '../styles/home.module.css';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Matchup = {
  id: number;
  team1Logo: string;
  Team1: string;
  team2Logo: string;
  Team2: string;
  Total: number;
  name: string;
  rank: number;
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

const dataSections = [
  {
    text: 'MLB',
    buttons: [
      { label: 'OVER/UNDER', href: '/mlb' },
      { label: 'MONEYLINE', href: '/mlbml' },
      { label: 'NRFI', href: '/nrfi' }
    ]
  },
  {
    text: 'NBA',
    buttons: [
      { label: 'ALT PROPS', href: '/prop' },
      { label: 'PROPS', href: '/fullprop' }
    ]
  }
];

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
    fetch('/mlblogos.json')
      .then(response => response.json())
      .then(data => setLogos(data))
      .catch(error => console.error('Error fetching logos:', error));

    fetch('/mlbmatchups.json')
      .then(response => response.json())
      .then((data: Matchup[]) => {
        setMatchups(data);

    fetch('/runs.json')
      .then(response => response.json())
      .then(data => setRunsData(data))
      .catch(error => console.error('Error fetching runs data:', error));
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
      const newDisplayMatchups = matchups.slice(currentMatchupIndex, currentMatchupIndex + 6);
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
        </Head>
        <div className={styles.banner}>
        <Image src="/betn.png" alt="Logo" width={350} height={200} className={styles.banimg} />
          <div className={styles.contentSection}>
            {/* Button sections here */}
            {dataSections.map((section, index) => (
              <div key={index} className={styles.dataSection}>
                <h1>{section.text}</h1>
                <div className={styles.buttonContainer}>
                {section.buttons.map((button, idx) => (
                  <Link key={idx} href={button.href} passHref>
                    <button className={styles.button}>{button.label}
                      <span className={styles.span}/>
                    </button>
                  </Link>
                ))}
                </div>
              </div>
            ))}
        <div className={styles.tableContainer}>
          <table className={styles.stattable1}>
            <thead>
              <tr>
                <th colSpan={2}>
                  <Image src="/bohm.avif" width={125} height={115}  alt="Highest Runs Per Game" className={styles.tableImage} />
                  <h3>Runs Scored Leaders (Last 10)</h3>
                </th>
              </tr>
            </thead>
            <tbody>
            {getHighestRuns().map(([team, values]) => (
              <tr key={team}>
                <td>
                  <Image src={logos[team]} alt={team} className={styles.logostat} width={80} height={80} />
                  {values[0].toFixed(2)}
                </td>
              </tr>
            ))}
            </tbody>
            <thead>
              <tr>
                <th colSpan={2}>
                  <h3>Runs Allowed Leaders (Last 10)</h3>
                </th>
              </tr>
              <tr>
              </tr>
            </thead>
            <tbody>
            {getLowestRunsAllowed().map(([team, values]) => (
              <tr key={team}>
                <td>
                  <Image src={logos[team]} alt={team} className={styles.logostat} width={80} height={80} />
                  {values[1].toFixed(2)}
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>         
    </div>
    
        <>
<div className={styles.about}>
    <h2>What is Breton?</h2>
    <div className={styles.imageContainer}>
      <div className={styles.imageTextContainer}>
        <Image src="/stats.png" alt="Logo" className={styles.aboutlogo} width={125} height={115} />
        <p>Our site pulls in advanced analytics of teams and players recent results. These metrics allow us to identify best &amp; worst performers.</p>
      </div>
      <div className={styles.imageTextContainer}>
        <Image src="/monitor.png" alt="Logo"  className={styles.aboutlogo} width={125} height={120} />
        <p>We use software engineered to modify values based upon matchups. After modifications, we find new values that give us deeper insights.</p>
      </div>
      <div className={styles.imageTextContainer}>
        <Image src="/money.png" alt="Logo"  className={styles.aboutlogo} width={125} height={120} />
        <p>All of our data gets posted and tracked daily. Use our data, find the plays you like best, and make money. It&apos;s just that easy.</p>
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
        <td>68%</td>
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

    <div className={styles.navbar}>
   
      <Image src="/bretpngw.png" alt="Logo" width={100} height={100} className={styles.logo} />
      <Link href="/" passHref></Link>
      <ul><li><Link href="/" passHref>HOME</Link></li>
        <li
          onMouseEnter={() => setIsMLBDropdownVisible(true)}
          onMouseLeave={() => setIsMLBDropdownVisible(false)}
        >
          MLB
          {isMLBDropdownVisible && (
            <div className={styles.dropdown}>
              <Link href="/mlb"><p>Over/Under</p></Link>
              <Link href="/mlbml"><p>ML PICKS</p></Link>
              <Link href="/nrfi"><p>NRFI</p></Link>
            </div>
          )}
        </li>
        <li
          onMouseEnter={() => setIsNbaDropdownVisible(true)}
          onMouseLeave={() => setIsNbaDropdownVisible(false)}
        >
          NBA
          {isNbaDropdownVisible && (
            <div className={styles.dropdown}>
              <Link href="/nba"><p>Over/Under</p></Link>
              <Link href="/fullprop"><p>Player Props</p></Link>
              <Link href="/prop"><p>Alt Player Props</p></Link>
            </div>
          )}
        </li>
        <li><Link href="/news">NEWS</Link></li>
        <li><Link href="/ncaab">CBB</Link></li>
      </ul>
      <div className={styles.odds}>
      <h4>Odds via:</h4>
      <Image src="/dkvert.png" alt="Logo" width={85} height={75} className={styles.logor}/>
      </div>
    </div>
    

    {/* Side Navigation content */}
    <div className={styles.sideNav} onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      <div className={styles.leaguelogo}>
        <Image src="/mlb.webp" alt="user-img"  width={110} height={60} />
      </div>
      <h4>MLB GAMES TODAY</h4>
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
              <div className={styles.total}>O/U: {matchup.Total} </div>
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
    <div className={styles.secondSideNav}>
      {rankings.length > 0 ? (
        <div>
        <div className={styles.ufclogo}>
        <Image src="/ufc.png" alt="user-img" width={125} height={40} />
      </div>
          <h3>STANDINGS</h3>
          <h4>{rankings[currentIndex].name}</h4>
          <tr className={styles.headshotRow}>
            <td colSpan={2}> {/* This will make the image span across all columns if there are more than one */}
              <Image
                src={rankings[currentIndex].imageUrl}
                alt={`Image for ${rankings[currentIndex].name}`}
                width={250}
                height={140}
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
            <Image src="/left-arrow.png" alt="Next" width={20} height={20} />
          </button>
          <button onClick={handleNext} className={styles.nextButton}>
            <Image src="/right-arrow.png" alt="Next" width={20} height={20} />
          </button>
        </div>
      ) : (
        <p>Loading rankings...</p>
      )}
    </div>
      <div className={styles.bottomNav}>
    <Link href="https://twitter.com/BretonPicks"><Image src="/x.png" alt="Logo" width={30} height={30} className={styles.bottomnavlogo} /></Link>
    </div></>
      </>
    );
  };
  export default Home;