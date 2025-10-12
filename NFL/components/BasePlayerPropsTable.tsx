import React from 'react';

interface YearStatPair {
  year: number;
  stat: number;
}

interface OpponentStatPair {
  opponent: string;
  stat: number;
}

interface PlayerData {
  name: string;
  team: string;
  opponent: string;
  current_opponent: string;
  line: number;
  stat: string;
  overUnder: 'OVER' | 'UNDER';
  odds: number;
  rate?: string;
  yearStatPairs?: YearStatPair[];
  opponentStatPairs?: OpponentStatPair[];
  // Backward compatibility
  years?: number[];
  statValues?: number[];
  opponents?: string[];
  playerHeadshot?: string;
  teamLogo?: string;
  opponentLogo?: string;
  matchupGrade?: string;
}

interface BasePlayerPropsTableProps {
  data: PlayerData[];
  title: string;
  subtitle?: string;
  pikkitLogo?: string;
  draftKingsLogo?: string;
}

// Function to get color for matchup grade
const getGradeColor = (grade: string): string => {
  switch (grade.toUpperCase()) {
    case 'A':
      return '#00ff00'; // Light green (current)
    case 'B':
      return '#00cc00'; // Darker green
    case 'C':
      return '#ffff00'; // Yellow
    case 'D':
      return '#ff8800'; // Orange
    case 'F':
      return '#ff4444'; // Red
    default:
      return '#00ff00'; // Default to light green
  }
};

const BasePlayerPropsTable: React.FC<BasePlayerPropsTableProps> = ({ data, title, subtitle, pikkitLogo, draftKingsLogo }) => {
  return (
    <div style={{
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: 'VTFRedzone, Arial, sans-serif',
      padding: '80px 60px',
      borderRadius: '48px',
      border: '8px solid #00ff00',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #00ff00',
        paddingBottom: '10px'
      }}>
        <div style={{ fontSize: '64px', color: '#fff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
          @BretonPicks
        </div>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}>
          <div style={{ 
            fontSize: '84px', 
            fontWeight: 'bold', 
            color: '#00ff00',
            textShadow: '2px 2px 4px rgba(0,255,0,0.3), 1px 1px 2px rgba(0,0,0,0.8)'
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ 
              fontSize: '32px', 
              color: '#fff', 
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              textAlign: 'center',
              marginTop: '8px'
            }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px',
          marginTop: '20px',
          marginRight: '40px'
        }}>
                    <div style={{ 
            fontSize: '28px', 
            color: '#00ff00', 
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'flex-end',
            marginBottom: '8px'
          }}>
            <span>Sponsored by:</span>
            <img 
              src={pikkitLogo || "./pikkit.png"}
              alt="Pikkit" 
              style={{
                height: '28px',
                width: 'auto'
              }}
            />
          </div>
          <div style={{ 
            fontSize: '28px', 
            color: '#fff', 
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            textAlign: 'right',
            lineHeight: '1.2'
          }}>
            Use code 'BRETON' and <br /> connect your sportsbook <br /> for a chance at $100!
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '32px',
          tableLayout: 'fixed',
          minWidth: '100%'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#1a1a1a',
              borderBottom: '2px solid #00ff00'
            }}>
              <th style={{
                padding: '20px 15px',
                textAlign: 'left',
                borderBottom: '2px solid #00ff00',
                color: '#00ff00',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                width: '28%'
              }}>
                PLAYER
              </th>

              <th style={{
                padding: '20px 15px',
                textAlign: 'center',
                borderBottom: '2px solid #00ff00',
                color: '#00ff00',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                width: '18%'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '24px'
                }}>
                  {draftKingsLogo && (
                    <img 
                      src={draftKingsLogo}
                      alt="DraftKings" 
                      style={{
                        height: '60px',
                        width: 'auto'
                      }}
                    />
                  )}
                  <span>LINE</span>
                </div>
              </th>

              <th style={{
                padding: '20px 15px',
                textAlign: 'center',
                borderBottom: '2px solid #00ff00',
                color: '#00ff00',
                    fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                width: '12%'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  {draftKingsLogo && (
                    <img 
                      src={draftKingsLogo}
                      alt="DraftKings" 
                      style={{
                        height: '60px',
                        width: 'auto'
                      }}
                    />
                  )}
                  <span>ODDS</span>
                </div>
              </th>
              <th style={{
                padding: '20px 15px',
                textAlign: 'center',
                borderBottom: '2px solid #00ff00',
                color: '#00ff00',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                width: '15%'
              }}>
                HIT RATE
              </th>
              <th style={{
                padding: '20px 15px',
                textAlign: 'center',
                borderBottom: '2px solid #00ff00',
                color: '#00ff00',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                width: '27%'
              }}>
                RECENT GAMES
              </th>
              <th style={{
                padding: '20px 15px',
                textAlign: 'center',
                borderBottom: '2px solid #00ff00',
                color: '#00ff00',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                width: '15%'
              }}>
                MATCHUP GRADE
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((player, index) => (
              <tr key={index} style={{
                backgroundColor: index % 2 === 0 ? '#1a1a1a' : '#0f0f0f',
                borderBottom: '1px solid #333'
              }}>
                {/* Player Column */}
                <td style={{
                  padding: '32px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {player.teamLogo && (
                    <img 
                      src={player.teamLogo} 
                      alt={player.team}
                      style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  {player.playerHeadshot && (
                    <img 
                      src={player.playerHeadshot} 
                      alt={player.name}
                      style={{
                        width: '128px',
                        height: '128px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '40px', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      {player.name}
                    </div>
                    <div style={{ fontSize: '28px', color: '#888', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      {player.team}
                    </div>
                    <div style={{ fontSize: '24px', color: '#888', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', marginTop: '16px' }}>
                      Opponent: {player.current_opponent}
                    </div>
                  </div>
                </td>

                {/* Line Column */}
                <td style={{
                  padding: '32px 20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    color: player.overUnder === 'OVER' ? '#00ff00' : '#ff4444',
                    fontWeight: 'bold',
                    fontSize: '32px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    marginBottom: '8px'
                  }}>
                    {player.overUnder}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '60px', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {player.line}
                  </div>
                  <div style={{ fontSize: '32px', color: '#888', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {player.stat}
                  </div>
                </td>

                {/* Odds Column */}
                <td style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#00ff00',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontSize: '64px'
                }}>
                  {player.odds}
                </td>

                {/* Hit Rate Column */}
                <td style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#00ff00',
                  fontSize: '64px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                  {player.rate || 'A'}
                </td>

                {/* Recent Games Column */}
                <td style={{
                  padding: '32px 20px',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '48px', justifyContent: 'center' }}>
                    {player.opponentStatPairs ? (
                      // New structure with opponentStatPairs (preferred)
                      player.opponentStatPairs.map((opponentStat, valueIndex) => (
                        <div key={valueIndex} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '48px'
                        }}>
                          <div style={{
                            fontSize: '32px',
                            color: '#888',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {opponentStat.opponent}
                          </div>
                          <div style={{
                            fontSize: '72px',
                            color: '#fff',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {opponentStat.stat}
                          </div>
                        </div>
                      ))
                    ) : player.opponents && player.statValues ? (
                      // Backward compatibility for old structure with opponents
                      player.opponents.map((opponent, valueIndex) => (
                        <div key={valueIndex} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '24px'
                        }}>
                          <div style={{
                            fontSize: '32px',
                            color: '#888',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {opponent}
                          </div>
                          <div style={{
                            fontSize: '72px',
                            color: '#fff',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {player.statValues[valueIndex]}
                          </div>
                        </div>
                      ))
                    ) : player.yearStatPairs ? (
                      // Fallback to yearStatPairs if no opponent data
                      player.yearStatPairs.map((yearStat, valueIndex) => (
                        <div key={valueIndex} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '24px'
                        }}>
                          <div style={{
                            fontSize: '32px',
                            color: '#888',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {yearStat.year}
                          </div>
                          <div style={{
                            fontSize: '72px',
                            color: '#fff',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {yearStat.stat}
                          </div>
                        </div>
                      ))
                    ) : player.years && player.statValues ? (
                      // Final fallback for old structure with years
                      player.years.map((year, valueIndex) => (
                        <div key={valueIndex} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '24px'
                        }}>
                          <div style={{
                            fontSize: '32px',
                            color: '#888',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {year}
                          </div>
                          <div style={{
                            fontSize: '48px',
                            color: '#fff',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {player.statValues[valueIndex]}
                          </div>
                        </div>
                      ))
                    ) : (
                      // Fallback for missing data
                      <div style={{
                        fontSize: '32px',
                        color: '#888',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}>
                        No stats available
                      </div>
                    )}
                  </div>
                </td>

                {/* Matchup Grade Column */}
                <td style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: getGradeColor(player.matchupGrade || 'A'),
                  fontSize: '72px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                  {player.matchupGrade || 'A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BasePlayerPropsTable;
