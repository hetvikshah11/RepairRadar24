import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Switch,
  Button,
  Autocomplete,
  IconButton,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { AddCircle, Delete } from "@mui/icons-material";
import api from "../axiosConfig";
import "./createjobcard.css";

export default function CreateJobCard() {
  const navigate = useNavigate();
  const [schema, setSchema] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  // for right panel (sublist display)
  const [activeSublist, setActiveSublist] = useState(null);

  // ✅ Fetch schema
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("Please log in first.");
      navigate("/");
      return;
    }

    api
      .get("/user/get-config", {
        headers: { authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data && res.data.schema) {
          setSchema(res.data.schema);

          // Pre-fill defaults
          const defaults = {};
          res.data.schema.forEach((f) => {
            if (f.type === "dropdown" && f.options?.length) {
              defaults[f.key] = f.options[0].value;
            } else if (f.type === "checkbox") {
              defaults[f.key] = false;
            } else if (f.type === "list") {
              defaults[f.key] = [];
            } else {
              defaults[f.key] = "";
            }
          });
          setFormData(defaults);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
          navigate("/");
          return;
        }
        console.error("Schema fetch failed", err);
        alert("Could not load schema.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // ✅ Update simple fields
  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ Handle list field row updates
  const handleListChange = (listKey, rowIndex, colKey, value) => {
    const updatedList = [...(formData[listKey] || [])];
    updatedList[rowIndex] = { ...updatedList[rowIndex], [colKey]: value };
    setFormData((prev) => ({ ...prev, [listKey]: updatedList }));
  };

  // ✅ Add row in list
  const addListRow = (listKey, fields) => {
    const newRow = {};
    fields.forEach((f) => {
      if (f.type === "dropdown" && f.options?.length) {
        newRow[f.key] = f.options[0].value;
      } else if (f.type === "checkbox") {
        newRow[f.key] = false;
      } else if (f.type === "list") {
        newRow[f.key] = [];
      } else {
        newRow[f.key] = "";
      }
    });
    setFormData((prev) => ({
      ...prev,
      [listKey]: [...(prev[listKey] || []), newRow],
    }));
  };

  // ✅ Remove row in list
  const removeListRow = (listKey, rowIndex) => {
    const updated = (formData[listKey] || []).filter((_, i) => i !== rowIndex);
    setFormData((prev) => ({ ...prev, [listKey]: updated }));
  };

  // ✅ Render non-list fields
  const renderSimpleField = (field, value, onChange) => {
    switch (field.type) {
      case "text":
      case "number":
      case "date":
        return (
          <TextField
            label={field.name}
            type={field.type === "number" ? "number" : field.type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
          />
        );

      case "dropdown":
        return (
          <Autocomplete
            options={field.options || []}
            value={
              value
                ? field.options.find((opt) => opt.value === value) || null
                : field.options[0] || null
            }
            getOptionLabel={(opt) => opt.value || ""}
            isOptionEqualToValue={(opt, val) => opt.value === val.value}
            onChange={(_, newVal) =>
              onChange(newVal ? newVal.value : field.options[0]?.value || "")
            }
            renderInput={(params) => (
              <TextField {...params} label={field.name} margin="normal" fullWidth size="small" />
            )}
          />
        );

      case "checkbox":
        return (
          <div className="switch-row">
            <span>{field.name}</span>
            <Switch checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          </div>
        );

      default:
        return null;
    }
  };

  // ✅ Save job
  const handleSave = async () => {
    const token = sessionStorage.getItem("token");
    try {
      await api.post("/user/jobs/savejobcard", formData, {
        headers: { authorization: `Bearer ${token}` },
      });
      alert("Job created successfully!");
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        navigate("/");
        return;
      }
      console.error("Job save failed:", err);
      alert("Could not save job.");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="split-container">
      {/* LEFT: basic fields + first-level lists */}
      <div className="left-panel">
        <h2 className="title">Create New Job</h2>
        <div className="fields-grid">
          {schema.map((field) => {
            if (field.type !== "list") {
              return (
                <div key={field.key} className="field-item">
                  {renderSimpleField(field, formData[field.key], (val) =>
                    handleChange(field.key, val)
                  )}
                </div>
              );
            }

            // First level list
            return (
              <div key={field.key} className="list-wrapper">
                <h4>{field.name}</h4>
                <Paper className="list-table">
                  <Table>
                    <TableHead>
                      <TableRow>
                        {field.fields.map((sub) => (
                          <TableCell key={sub.key}>{sub.name}</TableCell>
                        ))}
                        <TableCell>Sublist</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(formData[field.key] || []).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {field.fields.map((sub) => (
                            <TableCell key={sub.key}>
                              {sub.type === "list"
                                ? "-- sublist --"
                                : renderSimpleField(
                                    sub,
                                    row[sub.key],
                                    (val) => handleListChange(field.key, rowIndex, sub.key, val)
                                  )}
                            </TableCell>
                          ))}
                          <TableCell>
                            {field.fields.some((f) => f.type === "list") && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() =>
                                  setActiveSublist({
                                    parentKey: field.key,
                                    rowIndex,
                                    fields: field.fields.filter((f) => f.type === "list"),
                                  })
                                }
                              >
                                View Sublist
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              color="error"
                              onClick={() => removeListRow(field.key, rowIndex)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
                <Button
                  startIcon={<AddCircle />}
                  onClick={() => addListRow(field.key, field.fields)}
                  className="add-row-btn"
                >
                  Add {field.name}
                </Button>
              </div>
            );
          })}
        </div>

        <Button variant="contained" color="primary" onClick={handleSave} className="save-btn">
          Save Job
        </Button>
      </div>

      {/* RIGHT: show sublist if selected */}
      <div className="right-panel">
        {activeSublist ? (
          <>
            <h3>Sublist for Row {activeSublist.rowIndex + 1}</h3>
            {activeSublist.fields.map((sublistField) => (
              <div key={sublistField.key} className="list-wrapper">
                <h4>{sublistField.name}</h4>
                <Paper className="list-table">
                  <Table>
                    <TableHead>
                      <TableRow>
                        {sublistField.fields.map((sf) => (
                          <TableCell key={sf.key}>{sf.name}</TableCell>
                        ))}
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(
                        formData[activeSublist.parentKey]?.[activeSublist.rowIndex][
                          sublistField.key
                        ] || []
                      ).map((row, idx) => (
                        <TableRow key={idx}>
                          {sublistField.fields.map((sf) => (
                            <TableCell key={sf.key}>
                              {renderSimpleField(
                                sf,
                                row[sf.key],
                                (val) => {
                                  const updated = [...formData[activeSublist.parentKey]];
                                  updated[activeSublist.rowIndex] = {
                                    ...updated[activeSublist.rowIndex],
                                    [sublistField.key]: [
                                      ...(updated[activeSublist.rowIndex][sublistField.key] || []),
                                    ],
                                  };
                                  updated[activeSublist.rowIndex][sublistField.key][idx] = {
                                    ...row,
                                    [sf.key]: val,
                                  };
                                  setFormData((prev) => ({
                                    ...prev,
                                    [activeSublist.parentKey]: updated,
                                  }));
                                }
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            <IconButton
                              color="error"
                              onClick={() => {
                                const updated = [...formData[activeSublist.parentKey]];
                                updated[activeSublist.rowIndex][sublistField.key] =
                                  updated[activeSublist.rowIndex][sublistField.key].filter(
                                    (_, i) => i !== idx
                                  );
                                setFormData((prev) => ({
                                  ...prev,
                                  [activeSublist.parentKey]: updated,
                                }));
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
                <Button
                  startIcon={<AddCircle />}
                  onClick={() => {
                    const updated = [...formData[activeSublist.parentKey]];
                    const currentList =
                      updated[activeSublist.rowIndex][sublistField.key] || [];
                    const newRow = {};
                    sublistField.fields.forEach((sf) => {
                      newRow[sf.key] = "";
                    });
                    updated[activeSublist.rowIndex][sublistField.key] = [
                      ...currentList,
                      newRow,
                    ];
                    setFormData((prev) => ({
                      ...prev,
                      [activeSublist.parentKey]: updated,
                    }));
                  }}
                  className="add-row-btn"
                >
                  Add {sublistField.name}
                </Button>
              </div>
            ))}
          </>
        ) : (
          <p className="no-sublist">Select a row to view its sublist</p>
        )}
      </div>
    </div>
  );
}
