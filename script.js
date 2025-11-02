// Global variables
let philosophyWorks = [];
let currentBatchIndex = 0;
let batchSize = 5;
let userRatings = {};
let totalRated = 0;

// DOM elements
const ratingSection = document.getElementById('rating-section');
const resultsSection = document.getElementById('results-section');
const worksContainer = document.getElementById('works-container');
const submitBtn = document.getElementById('submit-btn');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const restartBtn = document.getElementById('restart-btn');

// Load Google Charts
google.charts.load('current', {'packages':['corechart']});

// Initialize the application
async function init() {
    try {
        const response = await fetch('philosophy_works.json');
        philosophyWorks = await response.json();
        displayCurrentBatch();
        updateProgress();
    } catch (error) {
        console.error('Error loading philosophy works:', error);
        worksContainer.innerHTML = '<p style="color: red;">Error loading data. Please refresh the page.</p>';
    }
}

// Display current batch of 5 works
function displayCurrentBatch() {
    worksContainer.innerHTML = '';

    const startIndex = currentBatchIndex * batchSize;
    const endIndex = Math.min(startIndex + batchSize, philosophyWorks.length);
    const currentBatch = philosophyWorks.slice(startIndex, endIndex);

    currentBatch.forEach((work, index) => {
        const workCard = createWorkCard(work, startIndex + index);
        worksContainer.appendChild(workCard);
    });

    // Enable/disable submit button
    submitBtn.disabled = false;
}

// Create a work card element
function createWorkCard(work, index) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.dataset.index = index;

    // Check if already rated
    if (userRatings[index] !== undefined) {
        card.classList.add(userRatings[index] === 1 ? 'upvoted' : 'downvoted');
    }

    card.innerHTML = `
        <div class="work-header">
            <div class="work-title">${work.title}</div>
            <div class="work-author">by ${work.author}</div>
        </div>
        <div class="work-info">
            <span class="work-school">${work.school}</span>
            <span class="work-years">${work.years}</span>
        </div>
        <div class="vote-buttons">
            <button class="vote-btn upvote-btn ${userRatings[index] === 1 ? 'active' : ''}"
                    onclick="handleVote(${index}, 1)">
                👍 Upvote
            </button>
            <button class="vote-btn downvote-btn ${userRatings[index] === -1 ? 'active' : ''}"
                    onclick="handleVote(${index}, -1)">
                👎 Downvote
            </button>
        </div>
    `;

    return card;
}

// Handle vote button clicks
function handleVote(index, vote) {
    const card = document.querySelector(`[data-index="${index}"]`);
    const upvoteBtn = card.querySelector('.upvote-btn');
    const downvoteBtn = card.querySelector('.downvote-btn');

    // Remove previous styling
    card.classList.remove('upvoted', 'downvoted');
    upvoteBtn.classList.remove('active');
    downvoteBtn.classList.remove('active');

    // If clicking the same vote, unvote
    if (userRatings[index] === vote) {
        delete userRatings[index];
    } else {
        // Apply new vote
        userRatings[index] = vote;

        if (vote === 1) {
            card.classList.add('upvoted');
            upvoteBtn.classList.add('active');
        } else {
            card.classList.add('downvoted');
            downvoteBtn.classList.add('active');
        }
    }

    updateProgress();
}

// Update progress bar
function updateProgress() {
    totalRated = Object.keys(userRatings).length;
    const percentage = (totalRated / philosophyWorks.length) * 100;

    progressFill.style.width = percentage + '%';
    progressText.textContent = `${totalRated} / ${philosophyWorks.length}`;
}

// Handle submit button click
submitBtn.addEventListener('click', () => {
    const startIndex = currentBatchIndex * batchSize;
    const endIndex = Math.min(startIndex + batchSize, philosophyWorks.length);

    // Check if all works in current batch are rated
    let allRated = true;
    for (let i = startIndex; i < endIndex; i++) {
        if (userRatings[i] === undefined) {
            allRated = false;
            break;
        }
    }

    if (!allRated) {
        alert('Please rate all works before submitting!');
        return;
    }

    // Move to next batch or show results
    currentBatchIndex++;

    if (currentBatchIndex * batchSize >= philosophyWorks.length) {
        // All works rated, show results
        showResults();
    } else {
        // Display next batch
        displayCurrentBatch();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Calculate and show results
function showResults() {
    // Calculate upvotes by school
    const schoolStats = {};

    philosophyWorks.forEach((work, index) => {
        const school = work.school;

        if (!schoolStats[school]) {
            schoolStats[school] = {
                upvotes: 0,
                downvotes: 0,
                total: 0
            };
        }

        schoolStats[school].total++;

        if (userRatings[index] === 1) {
            schoolStats[school].upvotes++;
        } else if (userRatings[index] === -1) {
            schoolStats[school].downvotes++;
        }
    });

    // Hide rating section and show results
    ratingSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    // Draw chart
    drawChart(schoolStats);
}

// Draw Google Chart
function drawChart(schoolStats) {
    // Prepare data for Google Charts
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'School of Philosophy');
    data.addColumn('number', 'Upvotes');
    data.addColumn({type: 'string', role: 'style'});

    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];
    let colorIndex = 0;

    for (const school in schoolStats) {
        data.addRow([
            school,
            schoolStats[school].upvotes,
            colors[colorIndex % colors.length]
        ]);
        colorIndex++;
    }

    const options = {
        title: 'Number of Works Rated Positively by School of Philosophy',
        titleTextStyle: {
            fontSize: 18,
            bold: true,
            color: '#333'
        },
        hAxis: {
            title: 'School of Philosophy',
            titleTextStyle: {
                fontSize: 14,
                bold: true,
                color: '#666'
            },
            textStyle: {
                fontSize: 12
            },
            slantedText: true,
            slantedTextAngle: 45
        },
        vAxis: {
            title: 'Number Rated Positively',
            titleTextStyle: {
                fontSize: 14,
                bold: true,
                color: '#666'
            },
            minValue: 0,
            format: '0'
        },
        legend: { position: 'none' },
        chartArea: {
            width: '75%',
            height: '60%'
        },
        height: 500,
        bar: { groupWidth: '70%' },
        animation: {
            startup: true,
            duration: 1000,
            easing: 'out'
        }
    };

    const chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}

// Restart survey
restartBtn.addEventListener('click', () => {
    // Reset all data
    currentBatchIndex = 0;
    userRatings = {};
    totalRated = 0;

    // Show rating section, hide results
    resultsSection.classList.add('hidden');
    ratingSection.classList.remove('hidden');

    // Display first batch
    displayCurrentBatch();
    updateProgress();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Start the application
init();
