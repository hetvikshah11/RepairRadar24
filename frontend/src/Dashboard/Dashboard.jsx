import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../axiosConfig";
import { Button, TextField, InputAdornment } from "@mui/material"; // Added InputAdornment
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SearchIcon from "@mui/icons-material/Search"; // Added SearchIcon
import Navbar from "../Navbar/Navbar";
import "./dashboard.css";

// Helper function to recursively search for a word in an object
const deepSearch = (obj, word) => {
  for (const key in obj) {
    const value = obj[key];
    if (value === null || value === undefined) continue;

    // If it's an object or array, recurse
    if (typeof value === "object") {
      if (deepSearch(value, word)) return true;
    }
    // If it's a primitive, check it
    else {
      if (String(value).toLowerCase().includes(word)) {
        return true;
      }
    }
  }
  return false;
};

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isPlanExpired, setIsPlanExpired] = useState(false);

  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      alert("You are not logged in. Please sign in.");
      navigate("/");
      return;
    }
    const hasPlanExpired = sessionStorage.getItem("isPlanExpired") === "true";
    setIsPlanExpired(hasPlanExpired);

    const fetchInitialData = async (isRetry = false) => {
      try {
        const countRes = await api.get("/user/jobs/count", {
          headers: { authorization: `Bearer ${token}` },
        });

        if (countRes.data?.total !== undefined) {
          setTotalJobs(countRes.data.total);
          if (countRes.data.total > 0) {
            await fetchJobs(0);
          }
        }
      } catch (err) {
        const status = err.response?.status;
        console.error("Error fetching initial data:", err);

        if (status === 401 && !isRetry) {
          console.warn("Got 401, retrying after 0.5s...");
          setTimeout(() => fetchInitialData(true), 500);
        } else if (!isRetry) {
          console.warn("Retrying fetch after 0.5s due to error...");
          setTimeout(() => fetchInitialData(true), 500);
        } else {
          navigate("/");
        }
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, token]);

  const fetchJobs = async (pageNum) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/user/jobs/getjobcards?offset=${pageNum * 20}&limit=20`,
        { headers: { authorization: `Bearer ${token}` } }
      );

      if (res.data && res.data.jobs) {
        if (pageNum === 0) {
          setJobs(res.data.jobs);
        } else {
          setJobs((prev) => [...prev, ...res.data.jobs]);
        }

        setPage(pageNum);
        const totalFetched = (pageNum + 1) * 20;
        setHasMore(totalFetched < totalJobs);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!searchTerm) {
      return jobs; // No filter, return all fetched jobs
    }

    // Split search term into individual words, make lowercase
    const searchWords = searchTerm
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 0);

    return jobs.filter((job) => {
      // Return true if *any* search word matches *any* field
      return searchWords.some((word) => deepSearch(job, word));
    });
  }, [searchTerm, jobs]); // Re-filter when search or jobs change

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="job-summary-section">
        <p className="job-summary">
          Total Jobs: <b>{totalJobs}</b>
        </p>

        <TextField
          label="Search Job Cards (e.g., Customer, Item, Job No)"
          variant="outlined"
          size="small"
          className="dashboard-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          className="create-job-btn"
          onClick={() => navigate("/create-job")}
          disabled={isPlanExpired}
        >
          Create Job Card
        </Button>
      </div>

      <div className="job-cards">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div key={job._id} className="job-card">
              <h3>Job #{job.job_no || "-"}</h3>
              <p>
                <b>Customer:</b> {job.customer_name || "-"}
              </p>
              <p>
                <b>Phone:</b> {job.customer_phone || "-"}
              </p>

              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                  </tr>
                </thead>
                <tbody>
                  {job.items && job.items.length > 0 ? (
                    job.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          {item.item_qty > 1
                            ? `${item.item_name} (${item.item_qty})`
                            : item.item_name}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td>-</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <button
                onClick={() => navigate(`/jobs/${job._id}`)}
                className="view-btn"
              >
                View Details
              </button>
            </div>
          ))
        ) : (
          <p className="no-jobs">
            {jobs.length === 0 && !loading
              ? "No jobs found."
              : "No jobs match your search."}
          </p>
        )}
      </div>

      <div className="pagination">
        {hasMore && !loading && !searchTerm && (
          <button onClick={() => fetchJobs(page + 1)} className="load-more-btn">
            Load More
          </button>
        )}
        {loading && <p>Loading...</p>}
      </div>
    </div>
  );
}