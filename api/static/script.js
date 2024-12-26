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
