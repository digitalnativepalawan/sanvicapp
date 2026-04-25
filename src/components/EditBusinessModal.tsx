// In the useEffect where you fetch data:
const { data, error } = await supabase
  .from("businesses")
  .select("*")
  .eq("visible", true)  // Add this line to only fetch visible businesses
  .order("created_at", { ascending: false });

// Also update the visible filter for admin viewing:
// For admin, we want to see ALL businesses (including hidden ones)
// For public, only visible ones

// Replace the current fetch with this:
if (isAdmin) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error && data) setItems(data as Business[]);
} else {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("visible", true)
    .order("created_at", { ascending: false });
  if (!error && data) setItems(data as Business[]);
}
