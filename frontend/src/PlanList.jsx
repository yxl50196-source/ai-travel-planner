import React, { useEffect, useState } from "react";

export default function PlanList({ token }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchPlans = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/plans", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setPlans(data.plans || []);
      } catch (err) {
        console.error("获取云端行程失败", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [token]);

  if (loading) return <p>加载中...</p>;
  if (!plans.length) return <p>暂无云端行程</p>;

  return (
    <div>
      <h2>历史云端行程</h2>
      {plans.map((plan) => (
        <div key={plan.id} style={{ marginBottom: 16 }}>
          {/* 这里使用你已有的 PlanCard 组件 */}
          <PlanCard plan={plan} />
        </div>
      ))}
    </div>
  );
}
