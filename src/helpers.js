export const convertTimestampToTime = (timestamp) => {
    if(!timestamp) return "just now"; 
    // if(!timestamp) timestamp = Date.now();
    // console.log(new Date(parseInt(timestamp + "000")));
    const d = (new Date(parseInt(timestamp + "000"))).toString().split(" ")[4].split(":");
    return d[0] + ":" + d[1];
};

export const convertTimestampToDate = (timestamp) => {
    const d = (new Date(parseInt(timestamp + "000"))).toString().split(" ");
    return d[1] + " " + d[2];
};