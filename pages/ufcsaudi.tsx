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
      <Image src="/nbadraft.png" alt="Logo" width={80} height={70} className={styles.logor} />
      </div>
    </div>
    <div className={styles.content2}>
      <span className={styles.span}/> 
      <h3>UFC Saudi Arabia AI Best Bets</h3>
      <div className={styles.tableContainer}>
        <table className={styles.stattable1}>
          <thead>
            <tr>
              <th colSpan={2}>
                <Image src="/ufcsaudi.webp" width={800} height={400} alt="Breton News Articles" className={styles.tableImage} />
                <p>Generated by AI after researching Best Bets <br />Published: 6/21</p>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2}>
                <p>
                  <strong>1. Ikram Aliskerov (+135) over Robert Whittaker (-155):</strong><br/>
                  <em>Reasoning:</em> While Whittaker is the higher-ranked fighter, Aliskerov is seen as a promising underdog with multiple avenues to victory. Aliskerov&apos;s striking power and sambo/judo background present a significant challenge to Whittaker, who typically relies on his takedowns and ground game to control fights. The oddsmakers have Whittaker favored due to his name recognition, but Aliskerov&apos;s diverse skillset makes him a compelling underdog bet.<br/>
                  <em>Source 1:</em> <cite>The Action Network</cite>: &quot;The main reason I want to back the underdog at +135 is that there are just so many more avenues to victory for Aliskerov. Whittaker has the advantage in the stand up and will likely win those exchanges, but Aliskerov can handle that power and is no slouch in that department himself. Aliskerov carries knockout power, and I think there is a world in which he beats Whittaker on the feet. Even if that is not the case, this fight will eventually go to the mat at one point, and that is where Aliskerov will have total control.&quot;
                </p>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <p>
                  <strong>2. Alexander Volkov (+200) over Sergei Pavlovich (-225):</strong><br/>
                  <em>Reasoning:</em> Despite Pavlovich&apos;s reputation as a knockout artist, Volkov&apos;s size, kickboxing skills, and prior experience fighting Pavlovich make him a valuable underdog pick. Volkov&apos;s ability to land impactful strikes could potentially disrupt Pavlovich&apos;s momentum and lead to an upset.<br/>
                  <em>Source 1:</em> <cite>The Action Network</cite>: &quot;Volkov&apos;s long frame, solid low kicks, and his familiarity with Pavlovich as a former training partner should all help Volkov find some openings. And if the 6-foot-7 fighter finds his mark more than a few times, the seemingly indestructible Pavlovich may finally get smashed up like an ugly Midwest icebox.&quot;
                </p>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <p>
                  <strong>3. Nicolas Dalby (+3.5 point spread, +120) over Rinat Fakhretdinov (-360):</strong><br/>
                  <em>Reasoning:</em> Dalby&apos;s recent success as an underdog, coupled with his superior cardio and resilience, make him a solid pick to at least win a round against Fakhretdinov. Dalby&apos;s ability to survive takedowns and potentially capitalize in the later rounds makes him a valuable play at plus odds.<br/>
                  <em>Source 1:</em> <cite>The Action Network</cite>: &quot;Dalby&apos;s &quot;point spread&quot; at DraftKings relies on him just winning one of the three rounds while not being finished, in a fight that&apos;s -175 to hit the judges. Dalby (+285) now fights Rinat Fakhretdinov (-360), who has just one finish in the UFC – and it came against Kevin Lee, who tore his ACL while entering the octagon. Dalby has also never been finished officially, with his one submission loss overturned due to his opponent&apos;s failed steroid test. With a background in karate, he&apos;s since made significant strides in the grappling department. While he&apos;s still not great at stopping takedowns, his ability to survive on the ground is impressive. Most importantly, Dalby has a massive cardio edge here. Fakhretdinov fell apart down the stretch in his last fight, losing the final round 10-8, while cardio is arguably Dalby&apos;s best attribute.&quot;
                </p>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <p>
                  <strong>4. Felipe Lima (-114) over Muhammad Naimov (-102):</strong><br/>
                  <em>Reasoning:</em> Despite fighting on short notice and at a higher weight class, Lima&apos;s impressive athleticism, cardio, and well-rounded skillset make him a strong pick against a less-experienced Naimov. Lima&apos;s ability to scramble and his relentless pursuit of submissions could be key to overcoming Naimov&apos;s size advantage.<br/>
                  <em>Source 1:</em> <cite>The Action Network</cite>: &quot;Lima won the Oktagon MMA bantamweight title one year ago, showing impressive cardio, output and scrambling across a 25-minute fight. At 26 years old, he&apos;s in his athletic prime and training at a top camp at All-Stars MMA in Sweden. Lima looks like a serious prospect and future contender; he has excellent footwork and combination striking and flows extremely well in grappling and wrestling exchanges. He aggressively pursues submission attempts on the ground but isn&apos;t content to accept the bottom position and stay on his back.&quot;
                </p>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <p>
                  <strong>5. Nasrat Haqparast (-240) over Jared Gordon (+195):</strong><br/>
                  <em>Source 1:</em> <cite>SportsLine</cite>: &quot;Haqparast has the speed, youth and reach advantage that should lead him to a unanimous decision win,&quot; Vithlani told SportsLine.<br/>
                  <em>Source 2:</em> <cite>The Action Network</cite>: &quot;Haqparast (16-5) is a seven-year UFC veteran and power puncher who has struggled against upper-tier competition but has won three straight against middling opponents. The 28-year-old German is coming off a first-round stoppage of marginal journeyman Jamie Mullarkey in October.&quot;
                </p>
                <br />
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