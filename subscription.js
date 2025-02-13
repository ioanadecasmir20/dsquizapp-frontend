async function upgradeToPremium() {
    let email = localStorage.getItem("currentUser");
    if (!email) {
        alert("You need to be logged in!");
        return;
    }

    // ✅ Simulating a payment process (replace this with actual payment API)
    let paymentConfirmed = confirm("Pay £9.99 for Premium?"); 

    if (!paymentConfirmed) return;

    // ✅ Update subscription status in Supabase
    let { error } = await supabase
        .from("users")
        .update({ subscription_status: "premium" })
        .eq("email", email);

    if (error) {
        console.error("❌ Error upgrading:", error.message);
        alert("Payment failed. Try again.");
        return;
    }

    // ✅ Update localStorage & UI
    localStorage.setItem("subscriptionStatus", "premium");
    alert("🎉 Upgrade successful! Restart the app to unlock all features.");
    window.location.reload();
}