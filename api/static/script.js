document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("video-form");
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const url = document.getElementById("url").value;

        fetch("/process_video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        })
            .then((response) => response.json())
            .then((data) => console.log(data))
            .catch((error) => {
                console.log(`Error received in script.js -> ${error}`);
                console.error(error);
            });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("video-form");
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const url = document.getElementById("url").value;

        fetch("/process_video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        })
            .then((response) => response.json())
            .then((data) => {
                let ele = document.getElementById('vid');
                for (let i = 0; i < 2; i++) {
                    ele.innerHTML += `<video width="320" height="240" controls style="margin: 10px;">
                <source src="../static/final_short_${i + 1}.mp4" />
                Your browser does not support the video tag.
            </video>`
                }
            })
            .catch((error) => {
                console.log(`Error received in script.js -> ${error}`);
                console.error(error);
            });
    });
});

