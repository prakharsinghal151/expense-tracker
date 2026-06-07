import { useState, useEffect, useRef } from "react";
import "./App.css";

const CATEGORIES = [
  { name: "Food", icon: "🍽️", color: "#f97316" },
  { name: "Travel", icon: "✈️", color: "#3b82f6" },
  { name: "Shopping", icon: "🛍️", color: "#a855f7" },
  { name: "Bills", icon: "📄", color: "#ef4444" },
  { name: "Health", icon: "❤️", color: "#10b981" },
  { name: "Other", icon: "📦", color: "#6b7280" },
];

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr) => {
  if (!dateStr) return "No Date";

  const d = new Date(dateStr + "T00:00:00");

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMonthLabel = (monthStr) => {
  if (!monthStr) return "";

  const [year, month] = monthStr.split("-");

  return new Date(year, month - 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const getCategoryMeta = (name) =>
  CATEGORIES.find((category) => category.name === name) ?? {
    icon: "📦",
    color: "#6b7280",
  };

function App() {
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState({});

  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetError, setBudgetError] = useState("");

  const budgetRef = useRef(null);
  const expenseNameRef = useRef(null);
  const amountRef = useRef(null);
  const categoryRef = useRef(null);
  const dateRef = useRef(null);

  const [expenses, setExpenses] = useState(() => {
    const savedExpenses = localStorage.getItem("expenses");
    return savedExpenses ? JSON.parse(savedExpenses) : [];
  });

  const [monthlyBudgets, setMonthlyBudgets] = useState(() => {
    const savedBudgets = localStorage.getItem("monthlyBudgets");
    return savedBudgets ? JSON.parse(savedBudgets) : {};
  });

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("monthlyBudgets", JSON.stringify(monthlyBudgets));
  }, [monthlyBudgets]);

  const handleEnter = (e, nextRef, action) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (nextRef?.current) {
        nextRef.current.focus();
      } else if (action) {
        action();
      }
    }
  };

  const clearField = (field) => {
    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const validateExpense = () => {
    const newErrors = {};

    if (!expenseName.trim()) {
      newErrors.name = "Expense name is required";
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Enter a valid amount greater than 0";
    }

    if (!date) {
      newErrors.date = "Please select a date";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const addExpense = () => {
    if (!validateExpense()) return;

    const newExpense = {
      id: editId !== null ? editId : Date.now(),
      name: expenseName,
      amount: Number(amount),
      category: category,
      date: date,
    };

    if (editId !== null) {
      const updatedExpenses = expenses.map((expense) =>
        expense.id === editId ? newExpense : expense
      );

      setExpenses(updatedExpenses);
      setEditId(null);
    } else {
      setExpenses([...expenses, newExpense]);
    }

    setSelectedMonth(date.slice(0, 7));
    setExpenseName("");
    setAmount("");
    setCategory("Food");
    setDate("");
    setErrors({});
    expenseNameRef.current?.focus();
  };

  const deleteExpense = (idToDelete) => {
    const updatedExpenses = expenses.filter(
      (expense) => expense.id !== idToDelete
    );

    setExpenses(updatedExpenses);
    setConfirmDeleteId(null);
  };

  const editExpense = (expenseToEdit) => {
    setExpenseName(expenseToEdit.name);
    setAmount(expenseToEdit.amount);
    setCategory(expenseToEdit.category || "Food");
    setDate(expenseToEdit.date || "");
    setEditId(expenseToEdit.id);
    setErrors({});
    expenseNameRef.current?.focus();
  };

  const cancelEdit = () => {
    setExpenseName("");
    setAmount("");
    setCategory("Food");
    setDate("");
    setEditId(null);
    setErrors({});
  };

  const saveMonthlyBudget = () => {
    if (!selectedMonth) {
      setBudgetError("Please select a month first");
      return;
    }

    if (isNaN(Number(budget)) || Number(budget) <= 0) {
      setBudgetError("Enter a valid budget amount");
      return;
    }

    setMonthlyBudgets({
      ...monthlyBudgets,
      [selectedMonth]: Number(budget),
    });

    setBudget("");
    setBudgetError("");
    expenseNameRef.current?.focus();
  };

  const deleteMonthlyBudget = () => {
    if (!selectedMonth) {
      setBudgetError("Please select a month first");
      return;
    }

    const confirmDelete = window.confirm(
      `Remove budget for ${formatMonthLabel(selectedMonth)}?`
    );

    if (confirmDelete) {
      const updatedBudgets = { ...monthlyBudgets };
      delete updatedBudgets[selectedMonth];

      setMonthlyBudgets(updatedBudgets);
      setBudget("");
      setBudgetError("");
    }
  };

  const clearAllExpenses = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to delete all expenses?"
    );

    if (confirmClear) {
      setExpenses([]);
      cancelEdit();
    }
  };

  const filteredExpenses = expenses
    .filter((expense) => {
      if (!selectedMonth) return false;

      const matchesMonth = expense.date?.startsWith(selectedMonth);

      const matchesSearch =
        expense.name.toLowerCase().includes(search.toLowerCase()) ||
        (expense.category || "").toLowerCase().includes(search.toLowerCase());

      return matchesMonth && matchesSearch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const selectedMonthTotal = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const selectedMonthBudget = monthlyBudgets[selectedMonth] || 0;
  const selectedMonthRemaining = selectedMonthBudget - selectedMonthTotal;

  const isOverBudget =
    selectedMonthBudget > 0 && selectedMonthRemaining < 0;

  const budgetPercent =
    selectedMonthBudget > 0
      ? Math.min((selectedMonthTotal / selectedMonthBudget) * 100, 100)
      : 0;

  const categoryTotals = filteredExpenses.reduce((totals, expense) => {
    const categoryName = expense.category || "Other";

    totals[categoryName] = (totals[categoryName] || 0) + expense.amount;

    return totals;
  }, {});

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-icon">💰</div>
          <h1>Expense Tracker</h1>
          <p>Track your monthly spending and stay on budget</p>
        </header>

        <section className="card">
          <h2>Month & Budget</h2>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setBudgetError("");
            }}
            onKeyDown={(e) => handleEnter(e, budgetRef)}
          />

          <input
            ref={budgetRef}
            type="text"
            inputMode="numeric"
            placeholder={
              selectedMonth
                ? `Budget for ${formatMonthLabel(selectedMonth)}`
                : "Select a month first"
            }
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value);
              setBudgetError("");
            }}
            onKeyDown={(e) => handleEnter(e, null, saveMonthlyBudget)}
          />

          {budgetError && <p className="error-msg">{budgetError}</p>}

          <div className="button-row">
            <button className="primary-btn" onClick={saveMonthlyBudget}>
              {selectedMonthBudget > 0 ? "Update Budget" : "Save Budget"}
            </button>

            {selectedMonthBudget > 0 && (
              <button className="ghost-btn" onClick={deleteMonthlyBudget}>
                Remove Budget
              </button>
            )}
          </div>
        </section>

        {selectedMonth ? (
          <>
            <div className="summary-grid">
              <div className="summary-card">
                <p>Budget</p>
                <h2>
                  {selectedMonthBudget > 0
                    ? formatINR(selectedMonthBudget)
                    : "—"}
                </h2>
              </div>

              <div className="summary-card spent">
                <p>Spent</p>
                <h2>{formatINR(selectedMonthTotal)}</h2>
              </div>

              <div
                className={`summary-card ${
                  isOverBudget ? "over" : "remaining"
                }`}
              >
                <p>{isOverBudget ? "Over By" : "Remaining"}</p>
                <h2>{formatINR(Math.abs(selectedMonthRemaining))}</h2>
              </div>
            </div>

            {selectedMonthBudget > 0 && (
              <div className="budget-bar-card">
                <div className="budget-bar-track">
                  <div
                    className={`budget-bar-fill ${
                      isOverBudget
                        ? "bar-over"
                        : budgetPercent > 75
                        ? "bar-warn"
                        : "bar-ok"
                    }`}
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>

                <span
                  className={`budget-bar-label ${
                    isOverBudget ? "label-over" : ""
                  }`}
                >
                  {isOverBudget
                    ? `⚠️ Budget exceeded by ${formatINR(
                        Math.abs(selectedMonthRemaining)
                      )}`
                    : `${budgetPercent.toFixed(0)}% of budget used`}
                </span>
              </div>
            )}
          </>
        ) : (
          <section className="card empty-state">
            <span className="empty-icon">📅</span>
            <p>Select a month to view your summary</p>
          </section>
        )}

        <section className="card">
          <h2>Category Breakdown</h2>

          {!selectedMonth ? (
            <div className="empty-state-inline">
              <span>📅</span> Select a month first
            </div>
          ) : Object.keys(categoryTotals).length === 0 ? (
            <div className="empty-state-inline">
              <span>📊</span> No expenses this month yet
            </div>
          ) : (
            <div className="category-list">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([categoryName, categoryAmount]) => {
                  const meta = getCategoryMeta(categoryName);

                  const percentage =
                    selectedMonthTotal > 0
                      ? ((categoryAmount / selectedMonthTotal) * 100).toFixed(0)
                      : 0;

                  return (
                    <div className="category-item" key={categoryName}>
                      <div className="category-left">
                        <span
                          className="category-dot"
                          style={{ background: meta.color }}
                        />
                        <span className="category-icon">{meta.icon}</span>
                        <span>{categoryName}</span>
                      </div>

                      <div className="category-right">
                        <strong>{formatINR(categoryAmount)}</strong>
                        <span className="category-pct">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        <section className="card">
          <h2>{editId !== null ? "✏️ Edit Expense" : "➕ Add Expense"}</h2>

          <input
            ref={expenseNameRef}
            type="text"
            placeholder="Expense name"
            value={expenseName}
            onChange={(e) => {
              setExpenseName(e.target.value);
              clearField("name");
            }}
            onKeyDown={(e) => handleEnter(e, amountRef)}
            className={errors.name ? "input-error" : ""}
          />

          {errors.name && <p className="error-msg">{errors.name}</p>}

          <input
            ref={amountRef}
            type="text"
            inputMode="numeric"
            placeholder="Amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              clearField("amount");
            }}
            onKeyDown={(e) => handleEnter(e, categoryRef)}
            className={errors.amount ? "input-error" : ""}
          />

          {errors.amount && <p className="error-msg">{errors.amount}</p>}

          <select
            ref={categoryRef}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={(e) => handleEnter(e, dateRef)}
          >
            {CATEGORIES.map((item) => (
              <option key={item.name} value={item.name}>
                {item.icon} {item.name}
              </option>
            ))}
          </select>

          <input
            ref={dateRef}
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              clearField("date");
            }}
            onKeyDown={(e) => handleEnter(e, null, addExpense)}
            className={errors.date ? "input-error" : ""}
          />

          {errors.date && <p className="error-msg">{errors.date}</p>}

          <button className="primary-btn full-btn" onClick={addExpense}>
            {editId !== null ? "Update Expense" : "Add Expense"}
          </button>

          {editId !== null && (
            <button className="ghost-btn full-btn" onClick={cancelEdit}>
              Cancel Edit
            </button>
          )}
        </section>

        <section className="card">
          <div className="section-heading">
            <h2>
              Expenses
              {selectedMonth && (
                <span className="month-label">
                  {formatMonthLabel(selectedMonth)}
                </span>
              )}
            </h2>

            <button className="danger-btn small-btn" onClick={clearAllExpenses}>
              Clear All
            </button>
          </div>

          <input
            type="text"
            placeholder="Search by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="expense-list">
            {!selectedMonth && (
              <div className="empty-state-inline">
                <span>📅</span> Select a month to view expenses
              </div>
            )}

            {selectedMonth && filteredExpenses.length === 0 && (
              <div className="empty-state-inline">
                <span>🔍</span> No expenses found
              </div>
            )}

            {filteredExpenses.map((expense) => {
              const meta = getCategoryMeta(expense.category);
              const isConfirming = confirmDeleteId === expense.id;

              return (
                <div
                  key={expense.id}
                  className={`expense-card ${
                    isConfirming ? "confirming" : ""
                  }`}
                >
                  <div
                    className="expense-cat-icon"
                    style={{
                      background: meta.color + "22",
                      color: meta.color,
                    }}
                  >
                    {meta.icon}
                  </div>

                  <div className="expense-info">
                    <h3>{expense.name}</h3>
                    <p>
                      {expense.category || "Other"} · {formatDate(expense.date)}
                    </p>
                  </div>

                  <div className="expense-amount">
                    {formatINR(expense.amount)}
                  </div>

                  {isConfirming ? (
                    <div className="confirm-btns">
                      <span className="confirm-label">Delete?</span>

                      <button
                        className="delete-btn small-btn"
                        onClick={() => deleteExpense(expense.id)}
                      >
                        Yes
                      </button>

                      <button
                        className="ghost-btn small-btn"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="expense-actions">
                      <button
                        className="edit-btn small-btn"
                        onClick={() => editExpense(expense)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn small-btn"
                        onClick={() => setConfirmDeleteId(expense.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;