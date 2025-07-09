import CompanionCard from '@/components/CompanionCard'
import CompanionsList from '@/components/CompanionsList'
import CTA from '@/components/CTA'
import { recentSessions } from '@/constants'
import React from 'react'

const Page = () => {
  return (
    <main>
      <h1>Popular Companions</h1>
      <section className='home-section'>
        <CompanionCard
          id="1"
          name="Companion One"
          topic="Topic One"
          subject="Subject One"
          duration={45}
          color="#ffda6e"
        />
        <CompanionCard
          id="2"
          name="Companion two"
          topic="Topic two"
          subject="Subject two"
          duration={30}
          color="#e5d0ff"
        />
        <CompanionCard
          id="3"
          name="Companion three"
          topic="Topic three"
          subject="Subject three"
          duration={30}
          color="#bde7ff"
        />
      </section>
      <section className='home-section'>
        <CompanionsList
          title="Recently Completed Sessions"
          companions={recentSessions}
          classNames="w-2/3 max-lg:w-full"
        />
        <CTA />
      </section>
    </main>
  )
}

export default Page