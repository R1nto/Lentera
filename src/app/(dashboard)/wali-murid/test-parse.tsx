'use client';

import * as React from 'react';

interface TestData {
  value: string;
}

export default async function TestPage() {
  return <TestComponent data={{ value: 'test' }} />;
}

function TestComponent({ data }: { data: TestData }) {
  return <div>{data.value}</div>;
}