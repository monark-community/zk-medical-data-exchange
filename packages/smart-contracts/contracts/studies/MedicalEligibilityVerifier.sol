// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 7904973696451828821443025023818702572830042702961919378852445452505375774826;
    uint256 constant alphay  = 14180043558467646852107807539669183240492016844985667373190774265572389960417;
    uint256 constant betax1  = 5410108010858159117834624961604748821114028923735860051227825130940631142384;
    uint256 constant betax2  = 15242825522451642283636774391834930547967073735827542462742881452659878152700;
    uint256 constant betay1  = 21001320785661768820681053550686604880078900511450997276979662428501072401274;
    uint256 constant betay2  = 6086726550735013571789655560340286877069445364877187842622048185029289879339;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 6064256130644775224177303963787260476234503327624227349861186072428295649538;
    uint256 constant deltax2 = 8924292296173281230798707642707350324517146933408413548571288316604542639731;
    uint256 constant deltay1 = 18671784455277934521818218083428792795047729506448862968475155859649268361968;
    uint256 constant deltay2 = 17996609755793725465613799826793735931988078806213716365699996498706023954700;

    
    uint256 constant IC0x = 14411164645199843165044730069285063690929509673391724879357182136800515382459;
    uint256 constant IC0y = 18826589355620481280372147821460865248216049733242759961856775327999805588483;
    
    uint256 constant IC1x = 8345998651312006767409884005746354906599638773382621312490814828086704646970;
    uint256 constant IC1y = 3997410986658862952160050038312720452259768001396934311832288799760761728957;
    
    uint256 constant IC2x = 21330765557414527579860889618037145384657360478461631010625122806345906157998;
    uint256 constant IC2y = 14735674986758834724107897753277460657815467308436606082963740421636073129594;
    
    uint256 constant IC3x = 21776516722449515937794637340283853803721249501779068582315993666526168835059;
    uint256 constant IC3y = 10569506019641723736535973195615604617688025273947133426393261094586530801072;
    
    uint256 constant IC4x = 14627105018712858023261038313372429629483382235825469847309386240524211192353;
    uint256 constant IC4y = 258708474160669861645406876337121614492247730963095935763186255114433224262;
    
    uint256 constant IC5x = 17019397991824311250704899198369372977970309557654718012782738437039984754900;
    uint256 constant IC5y = 166985539832394221011921224596965294948592751144694275598682677495734087838;
    
    uint256 constant IC6x = 16421049873964217243287777815645395979931787344758102834730274069472098479806;
    uint256 constant IC6y = 13700614419197702269573754954612026381588608947701767178729833468280409501152;
    
    uint256 constant IC7x = 370952302740342178329515026881608206191736703711012793778914449381063371225;
    uint256 constant IC7y = 10095946991732974642767904271444722380369813791503093496868793681951904613827;
    
    uint256 constant IC8x = 20192583038201186635219778411097000047812052923190627237961709116462459584996;
    uint256 constant IC8y = 6700296953372991027495763732271288405225945372968248719234594338884387444114;
    
    uint256 constant IC9x = 13856694328215490314337124284155771987443767228244527888731439698584447900410;
    uint256 constant IC9y = 21687929465162104601225858564933081492771980648566474024525796428065076143753;
    
    uint256 constant IC10x = 14201347758631248032756870074694017843682595066083527275238474645035045058672;
    uint256 constant IC10y = 5202884692500691413521053287565187348278961690357241143946956575764858699782;
    
    uint256 constant IC11x = 7699354532507353965313582843969330423319444510630114238318181979280384305741;
    uint256 constant IC11y = 2966399446941428696308691992808006373575587824684760062888189705528905232449;
    
    uint256 constant IC12x = 18616579487139038272493501416491746768174853338484451332239231485882116605479;
    uint256 constant IC12y = 2677568564867580357669205998728902736348727480559610122892196970005052963352;
    
    uint256 constant IC13x = 13907074102660201114872263955424570488070012545224060615093575602556600936298;
    uint256 constant IC13y = 5214794595649545985092978064880682967626472226218097886503572505502240002212;
    
    uint256 constant IC14x = 927826053786818225334951094238086711210022746468647841463531938317561753167;
    uint256 constant IC14y = 9397651636940193834112359823979043000576797642309154370583346643415396970400;
    
    uint256 constant IC15x = 4805646534792330536298484469871887105406101996375816689600537101507260961239;
    uint256 constant IC15y = 17897672345064794739894835182646324272099965085473984611764344262089026296914;
    
    uint256 constant IC16x = 619713381894772101345537695251438891812234680511269930144000679991560108395;
    uint256 constant IC16y = 6456537167891252533143478996971912942217584960575929831040848974931705479846;
    
    uint256 constant IC17x = 20956456424785353316277979428061454958781548589160511454252658422407942708999;
    uint256 constant IC17y = 9641247723846069338317091890279037025065897145731367372936677028544875250589;
    
    uint256 constant IC18x = 17008907350278432001124601841847758291146387754108275377486405389627114719245;
    uint256 constant IC18y = 15503697324963004539207663113767301875064352590377365219011664778990628969482;
    
    uint256 constant IC19x = 13904617322801957393209687422317615175701446792437573159908556841070348072318;
    uint256 constant IC19y = 4085663923117435929720085641933453934703855964917902181621837214398389241135;
    
    uint256 constant IC20x = 9973429911900504478626383707115527085120746429573549691329334308177283957572;
    uint256 constant IC20y = 15815025553475342017946467379266986324438394914364812868705700377562219694481;
    
    uint256 constant IC21x = 4342214294308430015115700026996756855727269119286032879906302382918217430269;
    uint256 constant IC21y = 18309431007203367749981382523590084306992403403779501408067960362276704025994;
    
    uint256 constant IC22x = 14866257695237201304093951334733997707931857389093599109891698122970675055743;
    uint256 constant IC22y = 7537461671853149816927023443772339907718319174958770922703270981667851547025;
    
    uint256 constant IC23x = 2781424046328018084695030974040952000307258699616650239631849160388245825579;
    uint256 constant IC23y = 19388100393622618258316918522737299878538972242368153052907238367119232123889;
    
    uint256 constant IC24x = 10876734224959174629777969547926214341079701668483821968465948922934447362708;
    uint256 constant IC24y = 7210747613289975531758676603954756081954764608909011365024189038719106930357;
    
    uint256 constant IC25x = 9996948961263114498445599126851303944476565418562697173202490115279922247089;
    uint256 constant IC25y = 12358721700282655255264130012794049676718493557593223645985103587855757928786;
    
    uint256 constant IC26x = 8569658786805443432531225150657331242100525554805715028950149264868826063106;
    uint256 constant IC26y = 20199277937632460404356131748397109413298826336170869743131961689881925615628;
    
    uint256 constant IC27x = 19412917009697315141522074590622849578839903243209752502387208808765790102788;
    uint256 constant IC27y = 19777734605412365803686789682716879542950643793600412572959914572087647095649;
    
    uint256 constant IC28x = 19182510849480718964539127346090274644802299079126522943763935552457638548971;
    uint256 constant IC28y = 13930754115630447321461647388424259371659098580843984076416647964615344089757;
    
    uint256 constant IC29x = 13308762262508115730577142209217491225899198785125541505167351977500956712423;
    uint256 constant IC29y = 17371438378985414427445333247117379795045744642437929378725186832337527937509;
    
    uint256 constant IC30x = 18574677506920503798529212536360946018698658450852990383288390250287863973542;
    uint256 constant IC30y = 2199650938635872616786505698421389778318710071268802461939377588796995882395;
    
    uint256 constant IC31x = 12381652825312327806358371301814057107438753695562861016138696021897061075165;
    uint256 constant IC31y = 16502203221150158627924963608902928085585901329519589251466483180440973374129;
    
    uint256 constant IC32x = 14938141450625579577533033117812270347091426545018386450395364651526361068896;
    uint256 constant IC32y = 12075876911875393152739843687776179845065611246774948092902676591034067028807;
    
    uint256 constant IC33x = 14571894476171329763699758052152250417451563363071168909305059223289983910648;
    uint256 constant IC33y = 13376335307091012321043671425478106027954309579260016173483716909129356992396;
    
    uint256 constant IC34x = 1000766235681705448687661150140115028199476094114828987782509984881011934135;
    uint256 constant IC34y = 10946466726358715268198146111583670655835013119007925939475033648514340190829;
    
    uint256 constant IC35x = 16035967291199760110108587663941157618752581432371135718428290044463020422793;
    uint256 constant IC35y = 6905384002124755588817147978533018384807761102417839551158829077921125693157;
    
    uint256 constant IC36x = 13289926514287624724040575810423240351761762949463740435629788719753718046355;
    uint256 constant IC36y = 5257143736031078884615799803155642181391731074316666782816516932648701158891;
    
    uint256 constant IC37x = 13981689777065495256289565215124925774810961141034767788752507796106848103529;
    uint256 constant IC37y = 5096107513128884873821133446595487973442987892378790532622442678621266045433;
    
    uint256 constant IC38x = 15543922930134138787267463640655550969364035403317299348613051807838745124711;
    uint256 constant IC38y = 20057194680819497078919204396390072296974939707563618193857955541746754879491;
    
    uint256 constant IC39x = 6137941452012855830239466248433843623695393696403323716966206271814612213333;
    uint256 constant IC39y = 5509686293437218196640493941327534741833607064831269660711078489843899389299;
    
    uint256 constant IC40x = 21179065590941299121717440474416231562797541079359685813179987225616962921202;
    uint256 constant IC40y = 11897130278132515747768762555476821620460375774517658271325539928325001095450;
    
    uint256 constant IC41x = 13483238760676676959612781361385526891800764865068310927419065076895394309449;
    uint256 constant IC41y = 3801506225945830508451944173439236463685379207849594388554777727020200600000;
    
    uint256 constant IC42x = 3244764540331539804715561279096115904422872650124343495618609062696415820999;
    uint256 constant IC42y = 11842608337478283379646680070235196950280619895636260844375543190680409121392;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[42] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                
                g1_mulAccC(_pVk, IC37x, IC37y, calldataload(add(pubSignals, 1152)))
                
                g1_mulAccC(_pVk, IC38x, IC38y, calldataload(add(pubSignals, 1184)))
                
                g1_mulAccC(_pVk, IC39x, IC39y, calldataload(add(pubSignals, 1216)))
                
                g1_mulAccC(_pVk, IC40x, IC40y, calldataload(add(pubSignals, 1248)))
                
                g1_mulAccC(_pVk, IC41x, IC41y, calldataload(add(pubSignals, 1280)))
                
                g1_mulAccC(_pVk, IC42x, IC42y, calldataload(add(pubSignals, 1312)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            
            checkField(calldataload(add(_pubSignals, 1184)))
            
            checkField(calldataload(add(_pubSignals, 1216)))
            
            checkField(calldataload(add(_pubSignals, 1248)))
            
            checkField(calldataload(add(_pubSignals, 1280)))
            
            checkField(calldataload(add(_pubSignals, 1312)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
