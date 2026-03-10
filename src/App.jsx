import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DatabaseProvider } from './context/DatabaseContext'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import AllTimeStandings from './pages/AllTimeStandings'
import SeasonHistory from './pages/SeasonHistory'
import OwnerProfile from './pages/OwnerProfile'
import HeadToHead from './pages/HeadToHead'
import WeeklyMatchups from './pages/WeeklyMatchups'
import DraftHistory from './pages/DraftHistory'
import Records from './pages/Records'
import TradeHistory from './pages/TradeHistory'

export default function App() {
  return (
    <DatabaseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="standings" element={<AllTimeStandings />} />
            <Route path="seasons" element={<SeasonHistory />} />
            <Route path="seasons/:season" element={<SeasonHistory />} />
            <Route path="owner/:name" element={<OwnerProfile />} />
            <Route path="h2h" element={<HeadToHead />} />
            <Route path="matchups" element={<WeeklyMatchups />} />
            <Route path="draft" element={<DraftHistory />} />
            <Route path="records" element={<Records />} />
            <Route path="trades" element={<TradeHistory />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DatabaseProvider>
  )
}
