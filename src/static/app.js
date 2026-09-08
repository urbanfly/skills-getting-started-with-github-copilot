document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.length = 1;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participants = details.participants.length
          ? details.participants
              .map(
                (participant) => `
                  <li>
                    <span>${participant}</span>
                    <button
                      type="button"
                      class="delete-participant"
                      data-activity="${encodeURIComponent(name)}"
                      data-email="${encodeURIComponent(participant)}"
                      aria-label="Unregister ${participant}"
                      title="Unregister participant"
                    >&times;</button>
                  </li>`
              )
              .join("")
          : "<li class=\"no-participants\">No participants yet</li>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <strong>Participants:</strong>
            <ul>${participants}</ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-participant").forEach((button) => {
        button.addEventListener("click", async () => {
          const activity = decodeURIComponent(button.dataset.activity);
          const email = decodeURIComponent(button.dataset.email);

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(email)}`,
              { method: "DELETE" }
            );

            if (!response.ok) {
              const result = await response.json();
              throw new Error(result.detail || "An error occurred");
            }

            await fetchActivities();
          } catch (error) {
            messageDiv.textContent = error.message || "Failed to unregister. Please try again.";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
            console.error("Error unregistering participant:", error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
