// League Data
const leagueData = {
    owners: [
        { id: 1, name: "Abe", teamName: "your crooked commish", seasons: 11, wins: 87, losses: 62, championships: 3, totalPoints: 16664.36 },
        { id: 2, name: "Asher", teamName: "St. Ronnie Ray-Gun 10", seasons: 11, wins: 51, losses: 103, championships: 0, totalPoints: 14729.65 },
        { id: 3, name: "Blake", teamName: "Call The Medic", seasons: 11, wins: 69, losses: 84, championships: 1, totalPoints: 15620.48 },
        { id: 4, name: "Carl", teamName: "the cactus curve", seasons: 4, wins: 19, losses: 33, championships: 0, totalPoints: 4528.0 },
        { id: 5, name: "Connor", teamName: "Farmer w/ Pitchfork", seasons: 3, wins: 20, losses: 19, championships: 0, totalPoints: 3496.78 },
        { id: 6, name: "Courtney", teamName: "The Pit of Despair", seasons: 8, wins: 59, losses: 53, championships: 1, totalPoints: 12130.62 },
        { id: 7, name: "Dan", teamName: "da bada bing", seasons: 11, wins: 86, losses: 69, championships: 0, totalPoints: 16441.2 },
        { id: 8, name: "Dominic", teamName: "Elaborate Team Suicide", seasons: 5, wins: 23, losses: 55, championships: 0, totalPoints: 6842.88 },
        { id: 9, name: "Ethan", teamName: "First Team All-Injured", seasons: 3, wins: 16, losses: 36, championships: 0, totalPoints: 4379.02 },
        { id: 10, name: "Hunter", teamName: "Hurts 2 PeePee", seasons: 11, wins: 91, losses: 59, championships: 2, totalPoints: 16458.16 },
        { id: 11, name: "Matt", teamName: "Plz Save My Season, Josh", seasons: 9, wins: 73, losses: 49, championships: 1, totalPoints: 13424.1 },
        { id: 12, name: "Mitch", teamName: "U.S. Space Force", seasons: 6, wins: 32, losses: 47, championships: 0, totalPoints: 7565.46 },
        { id: 13, name: "Scott", teamName: "Scott's so-so team", seasons: 1, wins: 4, losses: 9, championships: 0, totalPoints: 1004.08 },
        { id: 14, name: "Tom", teamName: "Domain Expansion JJs Nuts", seasons: 11, wins: 77, losses: 75, championships: 3, totalPoints: 16106.1 },
        { id: 15, name: "Will", teamName: "Gay Witch Abortion", seasons: 1, wins: 2, losses: 11, championships: 0, totalPoints: 979.76 }
    ],
    
    currentStandings: [
        { rank: 1, name: "MATT", teamName: "Plz Save My Season, Josh", wins: 11, losses: 2, avgPoints: 120.20 },
        { rank: 2, name: "ABE", teamName: "your crooked commish", wins: 8, losses: 5, avgPoints: 106.29 },
        { rank: 3, name: "HUNTER", teamName: "Hurts 2 PeePee", wins: 8, losses: 5, avgPoints: 115.62 },
        { rank: 4, name: "COURTNEY", teamName: "The Pit of Despair", wins: 8, losses: 5, avgPoints: 106.17 },
        { rank: 5, name: "TOM", teamName: "Domain Expansion JJs Nuts", wins: 6, losses: 7, avgPoints: 101.81 },
        { rank: 6, name: "BLAKE", teamName: "Call The Medic", wins: 6, losses: 7, avgPoints: 119.56 },
        { rank: 7, name: "ASHER", teamName: "St. Ronnie Ray-Gun 10", wins: 5, losses: 8, avgPoints: 96.64 },
        { rank: 8, name: "DAN", teamName: "da bada bing", wins: 5, losses: 8, avgPoints: 112.80 },
        { rank: 9, name: "DOMINIC", teamName: "Elaborate Team Suicide", wins: 4, losses: 9, avgPoints: 82.47 },
        { rank: 10, name: "ETHAN", teamName: "First Team All-Injured", wins: 4, losses: 9, avgPoints: 102.73 }
    ],
    
    weeklyWinners: [
        { week: 1, winner: "COURTNEY", icon: "🦈" },
        { week: 2, winner: "ABE", icon: "👑" },
        { week: 3, winner: "BLAKE", icon: "🦁" },
        { week: 4, winner: "BLAKE", icon: "🎯" },
        { week: 5, winner: "BLAKE", icon: "⭐" },
        { week: 6, winner: "BLAKE", icon: "🔥" },
        { week: 7, winner: "HUNTER", icon: "🎪" },
        { week: 8, winner: "TOM", icon: "🎨" },
        { week: 9, winner: "DAN", icon: "🚀" },
        { week: 10, winner: "BLAKE", icon: "💎" },
        { week: 11, winner: "ETHAN", icon: "⚡" },
        { week: 12, winner: "DAN", icon: "🎯" },
        { week: 13, winner: "MATT", icon: "👑" }
    ],
    
    highScores: [
        { week: 1, score: 157.42 },
        { week: 2, score: 168.54 },
        { week: 3, score: 152.96 },
        { week: 4, score: 142.98 },
        { week: 5, score: 140.52 },
        { week: 6, score: 143.46 },
        { week: 7, score: 136.40 },
        { week: 8, score: 142.98 },
        { week: 9, score: 148.82 },
        { week: 10, score: 156.22 },
        { week: 11, score: 157.88 },
        { week: 12, score: 201.12 },
        { week: 13, score: 155.62 }
    ]
};

// Safe element selector helper
function safeGetElement(id) {
    return document.getElementById(id);
}

// Draft Countdown Timer
function updateCountdown() {
    const draftDate = new Date('August 10, 2025 19:30:00 CST').getTime();
    const now = new Date().getTime();
    const distance = draftDate - now;
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    const daysEl = safeGetElement('days');
    const hoursEl = safeGetElement('hours');
    const minutesEl = safeGetElement('minutes');
    const secondsEl = safeGetElement('seconds');
    const timerEl = safeGetElement('countdownTimer');
    
    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    
    if (distance < 0 && timerEl) {
        timerEl.innerHTML = '<div class="draft-live">DRAFT IN PROGRESS!</div>';
    }
}

// Populate Current Standings
function populateStandings() {
    const standingsContainer = safeGetElement('currentStandings');
    if (!standingsContainer) return;
    
    leagueData.currentStandings.forEach(team => {
        const row = document.createElement('div');
        row.className = `standings-row ${team.rank <= 4 ? 'top-4' : ''}`;
        row.innerHTML = `
            <div class="team-info">
                <div class="team-number">${team.rank}</div>
                <span class="team-name">${team.name}</span>
            </div>
            <span>${team.wins}-${team.losses}</span>
            <span>${team.avgPoints.toFixed(2)}</span>
            <span>#${team.rank}</span>
        `;
        standingsContainer.appendChild(row);
    });
}

// Populate Weekly Winners
function populateWeeklyWinners() {
    const winnersGrid = safeGetElement('weeklyWinners');
    if (!winnersGrid) return;
    
    leagueData.weeklyWinners.forEach(winner => {
        const badge = document.createElement('div');
        badge.className = 'winner-badge';
        badge.innerHTML = `
            <div class="badge-icon">${winner.icon}</div>
            <div class="badge-week">WEEK ${winner.week}</div>
            <div class="badge-winner">${winner.winner}</div>
        `;
        winnersGrid.appendChild(badge);
    });
}

// Populate High Scores
function populateHighScores() {
    const scoresGrid = safeGetElement('highScores');
    if (!scoresGrid) return;
    
    leagueData.highScores.forEach(score => {
        const item = document.createElement('div');
        item.className = 'score-item';
        item.innerHTML = `
            <span class="score-week">WEEK ${score.week}</span>
            <span class="score-value">${score.score.toFixed(2)}</span>
        `;
        scoresGrid.appendChild(item);
    });
}

// Populate Player Profiles
function populatePlayerProfiles() {
    const profilesGrid = safeGetElement('playerProfiles');
    if (!profilesGrid) return;
    
    // Current season active owners
    const activeOwners = leagueData.currentStandings.map(standing => standing.name);
    
    activeOwners.forEach(owner => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
            <div class="profile-avatar">
                <img src="placeholder-avatar.svg" alt="${owner}">
            </div>
            <div class="profile-name">${owner}</div>
        `;
        profilesGrid.appendChild(card);
    });
}

// Populate Dynasty Stats
function populateDynastyStats() {
    // Championship Leaders
    const championshipContainer = safeGetElement('championshipLeaders');
    if (championshipContainer) {
        const championshipLeaders = leagueData.owners
            .filter(owner => owner.championships > 0)
            .sort((a, b) => b.championships - a.championships)
            .slice(0, 5);
        
        championshipLeaders.forEach((owner, index) => {
            const item = document.createElement('div');
            item.className = 'dynasty-item';
            item.innerHTML = `
                <span class="dynasty-rank">${index + 1}</span>
                <span class="dynasty-name">${owner.name}</span>
                <span class="dynasty-value">${owner.championships} 🏆</span>
            `;
            championshipContainer.appendChild(item);
        });
    }
    
    // Win Percentage Leaders
    const winPctContainer = safeGetElement('winPercentageLeaders');
    if (winPctContainer) {
        const winPctLeaders = leagueData.owners
            .filter(owner => owner.wins + owner.losses >= 20)
            .map(owner => ({
                ...owner,
                winPct: (owner.wins / (owner.wins + owner.losses) * 100)
            }))
            .sort((a, b) => b.winPct - a.winPct)
            .slice(0, 5);
        
        winPctLeaders.forEach((owner, index) => {
            const item = document.createElement('div');
            item.className = 'dynasty-item';
            item.innerHTML = `
                <span class="dynasty-rank">${index + 1}</span>
                <span class="dynasty-name">${owner.name}</span>
                <span class="dynasty-value">${owner.winPct.toFixed(1)}%</span>
            `;
            winPctContainer.appendChild(item);
        });
    }
    
    // Total Points Leaders
    const pointsContainer = safeGetElement('totalPointsLeaders');
    if (pointsContainer) {
        const pointsLeaders = leagueData.owners
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, 5);
        
        pointsLeaders.forEach((owner, index) => {
            const item = document.createElement('div');
            item.className = 'dynasty-item';
            item.innerHTML = `
                <span class="dynasty-rank">${index + 1}</span>
                <span class="dynasty-name">${owner.name}</span>
                <span class="dynasty-value">${owner.totalPoints.toFixed(0)}</span>
            `;
            pointsContainer.appendChild(item);
        });
    }
    
    // Playoff Appearances
    const playoffContainer = safeGetElement('playoffLeaders');
    if (playoffContainer) {
        const playoffLeaders = leagueData.owners
            .map(owner => ({
                ...owner,
                playoffApps: Math.round(owner.seasons * (owner.wins / (owner.wins + owner.losses)))
            }))
            .sort((a, b) => b.playoffApps - a.playoffApps)
            .slice(0, 5);
        
        playoffLeaders.forEach((owner, index) => {
            const item = document.createElement('div');
            item.className = 'dynasty-item';
            item.innerHTML = `
                <span class="dynasty-rank">${index + 1}</span>
                <span class="dynasty-name">${owner.name}</span>
                <span class="dynasty-value">${owner.playoffApps}</span>
            `;
            playoffContainer.appendChild(item);
        });
    }
}

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Try to populate all sections - they'll safely skip if elements don't exist
    populateStandings();
    populateWeeklyWinners();
    populateHighScores();
    populatePlayerProfiles();
    populateDynastyStats();
    
    // Start countdown timer if it exists
    if (safeGetElement('countdownTimer')) {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
    
    // Add hover animations
    const cards = document.querySelectorAll('.winner-badge, .profile-card, .nav-item');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});