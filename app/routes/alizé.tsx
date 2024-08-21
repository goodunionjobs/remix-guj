import { useParams } from "@remix-run/react";

export default function Alize() {
  const params = useParams();
  return (
    <div>
      <h1>**Alizé Route</h1>
      <p>Path: {params["*"]}</p>
    </div>
  );
}
