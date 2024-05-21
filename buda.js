function calculateTotals(entries, timestampLimit) {
    let totalCLP = 0;
    let totalBTC = 0;

    for (const entry of entries) {
        const [entryTimestamp, entryAmount, entryPrice] = entry;

        if (entryTimestamp < timestampLimit) break;

        totalCLP += Number(entryPrice);
        totalBTC += Number(entryAmount);
    }

    return {
        totalCLP,
        totalBTC
    };
}

function fillTimeRangeData(totalCLP, totalBTC, timestampLimit, currentTimestamp, previousTotalBTC) {
    return {
        timeRange: `${new Date(timestampLimit).toLocaleString()} - ${new Date(currentTimestamp).toLocaleString()}`,
        totalCLP: totalCLP,
        totalBTC: totalBTC,
        commission: totalCLP * 0.008, // 0.8% commission
        percentDifferenceLastTimeRange: previousTotalBTC ? `${((totalBTC - previousTotalBTC) / previousTotalBTC) * 100}%` : undefined,
    };
}

async function fetchEntries(timestamp) {
    try {
        const url = `https://www.buda.com/api/v2/markets/btc-clp/trades?timestamp=${timestamp}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.trades.entries;
    } catch (error) {
        throw new Error(`Failed to fetch entries: ${error}`);
    }
}

async function fetchData(timestamps) {
    const timeRanges = [];

    for (let i = 0; i < timestamps.length; i++) {
        const currentTimestamp = timestamps[i];
        const timestampLimit = currentTimestamp - 3600000; // one hour before
        let entries = [];
        let isFirstFetch = true;

        while (isFirstFetch || entries.length > 0 && entries[entries.length - 1][0] > timestampLimit) {
            const lastTimestamp = isFirstFetch ? currentTimestamp : entries[entries.length - 1][0];
            const newEntries = await fetchEntries(lastTimestamp);
            isFirstFetch = false;
            entries.push(...newEntries);
        }

        const {
            totalCLP,
            totalBTC
        } = calculateTotals(entries, timestampLimit);
        const previousTotalBTC = i > 0 ? timeRanges[i - 1].totalBTC : undefined;
        const currentTimeRange = fillTimeRangeData(totalCLP, totalBTC, timestampLimit, currentTimestamp, previousTotalBTC);
        timeRanges.push(currentTimeRange);
    };

    return timeRanges;
}

const timestamps = [
    new Date("2023-03-01T13:00:00").getTime(),
    new Date("2024-03-01T13:00:00").getTime()
]

fetchData(timestamps).then(data => {
    console.log("Data:", data);
});