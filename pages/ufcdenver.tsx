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
      const newDisplayMatchups = matchups.slice(currentMatchupIndex, currentMatchupIndex + 6);
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
          <link rel="icon" href="/favicon.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale= 1, user-scalable=yes" />
        </Head>
        <div className={styles.banner2}>
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
    <span className={styles.span}/> 
    <h3>UFC Denver: AI Best Bets</h3>
    <div className={styles.tableContainer}>
      <table className={styles.stattable1}>
        <thead>
          <tr>
            <th colSpan={2}>
              <Image src="/ufcdenver.jpeg" width={800} height={400} alt="Breton News Articles" className={styles.tableImage} />
              <p>Generated by AI after researching Best Bets <br />Published: (7/13)</p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>1. Andre Petroski (-107):</strong><br/>
                <em>Reasoning:</em> Petroski is favored due to his elite grappling skills and consistent success in the UFC, particularly against opponents susceptible to takedowns. Fremd's history of surrendering takedowns, especially against non-grapplers, makes him vulnerable to Petroski's expertise on the ground. Petroski's consistent performance, despite a few fluky losses, solidifies him as the better overall fighter in this matchup.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>2. Da'Mon Blackshear (+125):</strong><br/>
                <em>Reasoning:</em> While Jackson boasts a winning streak, his opponents have been less impressive, making his current odds seem inflated. Blackshear's submission dominance, with no tapouts across his career, makes him a threat to Jackson, who relies heavily on wrestling. Blackshear's recent performance against Bautista, despite the loss, showcases his striking ability and takedown prowess, making him a valuable underdog.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>3. Drew Dober by KO/TKO/DQ (+185):</strong><br/>
                <em>Reasoning:</em> Dober's recent losses have unfairly lowered his stock, while Silva's quick rise might be inflating his perceived value. Dober's experience fighting in Denver, acclimating him to the altitude, gives him an advantage. His knockout power, coupled with Silva's questionable defense, makes Dober a compelling bet to finish the fight.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>4. Muslim Salikhov (+164):</strong><br/>
                <em>Reasoning:</em> Both fighters are veterans coming off knockout losses. Salikhov's superior footwork, movement, and striking range in a larger octagon, combined with Ponzinibbio's preference for close-range exchanges, gives Salikhov an edge. Ponzinibbio's striking thrives in a smaller octagon, making Salikhov's experience in a larger setting a key advantage. Salikhov's ability to tire opponents through grappling presents another avenue for success in this matchup.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>5. Rose Namajunas by Decision (-105):</strong><br/>
                <em>Reasoning:</em> Although Cortez is a skilled fighter, Namajunas' experience in five-round fights, having fought some of the best in the world, makes her the more reliable pick. Cortez's lack of ranked wins and the unknowns surrounding her first five-round fight raise concerns about her stamina. Namajunas' defensive striking, grappling proficiency, and active striking style make her the better bet for a victory, even if Cortez can potentially secure takedowns.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>6. Santiago Ponzinibbio (-185):</strong><br/>
                <em>Reasoning:</em> Despite their aging status, Ponzinibbio's recent struggles are attributed to facing mostly ranked opponents, while Salikhov's losses highlight his vulnerability against stronger opponents. Ponzinibbio's superior volume striking and cardio are expected to overwhelm Salikhov in the later rounds, potentially leading to a finish. Salikhov's potential early success is seen as temporary, with Ponzinibbio ultimately taking control of the fight.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>7. Ange Loosa (+270):</strong><br/>
                <em>Reasoning:</em> Bonfim's aggressive, finishing-oriented style makes him a favorite, but Loosa's durability and excellent takedown defense make him a valuable underdog bet. Bonfim's reliance on takedowns might be ineffective against Loosa, who excels in striking and cardio, allowing him to potentially outwork Bonfim. Loosa's experience in longer fights, compared to Bonfim's propensity for quick finishes, presents an advantage if the fight goes the distance.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>8. Christian Rodriguez by Decision (+175):</strong><br/>
                <em>Reasoning:</em> Rodriguez's well-rounded game and recent string of victories against talented prospects make him a compelling favorite against Erosa. Erosa's durability concerns and vulnerability to takedowns present opportunities for Rodriguez to exploit. Rodriguez's ability to overcome early adversity and his own grappling expertise make him the stronger bet in this matchup.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>9. Abdul Razak Alhassan (Favorite):</strong><br/>
                <em>Reasoning:</em> While Brundage's wrestling presents a threat to Alhassan, his lack of striking output and susceptibility to being stopped by strikes make Alhassan the more likely victor. Alhassan's knockout power is a significant advantage in this matchup, particularly if Brundage fails to secure takedowns consistently. The likelihood of the fight ending within the first two rounds, due to Alhassan's finishing ability and Brundage's vulnerability to strikes, favors the under 2.5 rounds prop bet.
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p>
                <strong>10. Joshua Van (-250):</strong><br/>
                <em>Reasoning:</em> Joshua Van has established himself as a very tough matchup in the UFC. He has elite cardio, often times finding more success as the fight continues. If he can withstand any early pushes from Charles Johnson, he will be able to establish himself in the 2nd and 3rd rounds. If you want to get “cheeky” with it, wait until after the first round where Van’s odds may move to closer to the -150 area, and provides greater value to his Moneyline picks. Or throw this as a solid -250 leg in your parlays.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  

  </>
);
};

export default Home;